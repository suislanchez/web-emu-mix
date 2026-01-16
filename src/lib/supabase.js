import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase project settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isOfflineMode = !supabaseUrl || !supabaseAnonKey

if (isOfflineMode) {
  console.warn('Supabase credentials not configured. Running in offline mode.')
}

// Create client only if credentials exist, otherwise use a dummy placeholder
export const supabase = isOfflineMode
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const auth = {
  async signUp(email, password, username) {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin
      }
    })
    if (error) throw error

    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        email,
      })
    }

    return data
  },

  async signIn(email, password) {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  async signOut() {
    if (!supabase) throw new Error('Offline mode')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getUser() {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getSession() {
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  onAuthStateChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
    return supabase.auth.onAuthStateChange(callback)
  },

  // OAuth providers
  async signInWithGoogle() {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
    return data
  },

  async signInWithGitHub() {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
    return data
  },

  async signInWithDiscord() {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
    return data
  }
}

// Profile helpers
export const profiles = {
  async get(userId) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  async update(userId, updates) {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async uploadAvatar(userId, file) {
    if (!supabase) throw new Error('Offline mode')
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    await profiles.update(userId, { avatar_url: publicUrl })
    return publicUrl
  }
}

// Game saves helpers
export const saves = {
  async list(userId) {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('game_saves')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  },

  async get(userId, gameId) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('game_saves')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async save(userId, gameId, saveData) {
    if (!supabase) throw new Error('Offline mode')
    // Upload save data to storage
    const filePath = `${userId}/${gameId}/save.bin`
    const { error: uploadError } = await supabase.storage
      .from('saves')
      .upload(filePath, saveData, { upsert: true })

    if (uploadError) throw uploadError

    // Upsert save record
    const { data, error } = await supabase
      .from('game_saves')
      .upsert({
        user_id: userId,
        game_id: gameId,
        save_path: filePath,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,game_id' })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async load(userId, gameId) {
    if (!supabase) return null
    const saveRecord = await saves.get(userId, gameId)
    if (!saveRecord) return null

    const { data, error } = await supabase.storage
      .from('saves')
      .download(saveRecord.save_path)

    if (error) throw error
    return data
  },

  async delete(userId, gameId) {
    if (!supabase) throw new Error('Offline mode')
    const saveRecord = await saves.get(userId, gameId)
    if (saveRecord) {
      await supabase.storage.from('saves').remove([saveRecord.save_path])
    }

    const { error } = await supabase
      .from('game_saves')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId)

    if (error) throw error
  }
}

// Play sessions / history
export const sessions = {
  async start(userId, gameId, gameName, systemId) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('play_sessions')
      .insert({
        user_id: userId,
        game_id: gameId,
        game_name: gameName,
        system_id: systemId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async end(sessionId, playtime) {
    if (!supabase) return
    const { error } = await supabase
      .from('play_sessions')
      .update({
        ended_at: new Date().toISOString(),
        playtime_seconds: playtime,
      })
      .eq('id', sessionId)
    if (error) throw error
  },

  async getHistory(userId, limit = 20) {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('play_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async getStats(userId) {
    if (!supabase) return null
    const { data, error } = await supabase
      .rpc('get_user_stats', { user_id_param: userId })
    if (error) throw error
    return data
  }
}

// Comments
export const comments = {
  async list(gameId, limit = 50) {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async add(userId, gameId, content) {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        game_id: gameId,
        content,
      })
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .single()
    if (error) throw error
    return data
  },

  async delete(commentId, userId) {
    if (!supabase) throw new Error('Offline mode')
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)
    if (error) throw error
  }
}

// Ratings
export const ratings = {
  async get(gameId) {
    if (!supabase) return { average: 0, count: 0 }
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('game_id', gameId)
    if (error) throw error

    if (!data.length) return { average: 0, count: 0 }

    const sum = data.reduce((acc, r) => acc + r.rating, 0)
    return {
      average: sum / data.length,
      count: data.length
    }
  },

  async getUserRating(userId, gameId) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data?.rating || null
  },

  async set(userId, gameId, rating) {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase
      .from('ratings')
      .upsert({
        user_id: userId,
        game_id: gameId,
        rating,
      }, { onConflict: 'user_id,game_id' })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// Achievements
export const achievements = {
  async getAll() {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: true })
    if (error) throw error
    return data
  },

  async getUserAchievements(userId) {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (*)
      `)
      .eq('user_id', userId)
    if (error) throw error
    return data
  },

  async unlock(userId, achievementId) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
      })
      .select(`
        *,
        achievements (*)
      `)
      .single()
    if (error && error.code !== '23505') throw error // Ignore duplicate
    return data
  },

  async checkAndUnlock(userId, stats) {
    if (!supabase || !stats) return []
    const allAchievements = await achievements.getAll()
    const userAchievements = await achievements.getUserAchievements(userId)
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id))

    const newUnlocks = []

    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue

      let shouldUnlock = false

      switch (achievement.condition_type) {
        case 'games_played':
          shouldUnlock = stats.total_games >= achievement.condition_value
          break
        case 'total_playtime':
          shouldUnlock = stats.total_playtime >= achievement.condition_value
          break
        case 'systems_played':
          shouldUnlock = stats.systems_played >= achievement.condition_value
          break
        case 'saves_created':
          shouldUnlock = stats.saves_count >= achievement.condition_value
          break
      }

      if (shouldUnlock) {
        const unlocked = await achievements.unlock(userId, achievement.id)
        if (unlocked) newUnlocks.push(unlocked)
      }
    }

    return newUnlocks
  }
}

// User Library (game collection)
export const library = {
  async list(userId, filter = null) {
    if (!supabase) return []
    let query = supabase
      .from('user_library')
      .select(`
        *,
        game_catalog (
          id, title, system_id, region, cover_url, myrient_path, genres
        )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (filter === 'ready') {
      query = query.or('download_status.eq.completed,storage_type.eq.external')
    } else if (filter === 'cloud') {
      query = query.eq('storage_type', 'supabase')
    } else if (filter === 'external') {
      query = query.in('storage_type', ['google_drive', 'dropbox', 'external'])
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async get(userId, libraryId) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('user_library')
      .select(`
        *,
        game_catalog (*)
      `)
      .eq('id', libraryId)
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async add(userId, catalogId, storageType = 'external') {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase
      .from('user_library')
      .upsert({
        user_id: userId,
        catalog_id: catalogId,
        storage_type: storageType,
        download_status: storageType === 'external' ? 'external' : 'pending',
        added_at: new Date().toISOString()
      }, { onConflict: 'user_id,catalog_id,storage_type' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(userId, libraryId) {
    if (!supabase) throw new Error('Offline mode')
    // Get the item first to check storage
    const item = await library.get(userId, libraryId)

    // If stored in Supabase, delete the file
    if (item?.storage_type === 'supabase' && item?.storage_path) {
      await supabase.storage.from('user_roms').remove([item.storage_path])
    }

    const { error } = await supabase
      .from('user_library')
      .delete()
      .eq('id', libraryId)
      .eq('user_id', userId)
    if (error) throw error

    // Update quota
    await supabase.rpc('update_user_storage_quota', { user_id_param: userId })
  },

  async getStatusBatch(userId, catalogIds) {
    if (!supabase || !catalogIds.length) return {}
    const { data, error } = await supabase
      .from('user_library')
      .select('catalog_id, download_status, storage_type')
      .eq('user_id', userId)
      .in('catalog_id', catalogIds)

    if (error) throw error

    const status = {}
    for (const item of data || []) {
      status[item.catalog_id] = item
    }
    return status
  },

  async startDownload(userId, catalogId, myrientPath) {
    if (!supabase) throw new Error('Offline mode')

    // Call the myrient-proxy edge function
    const { data, error } = await supabase.functions.invoke('myrient-proxy', {
      body: { myrientPath, catalogId }
    })

    if (error) throw error
    return data
  },

  async updateLastPlayed(userId, libraryId) {
    if (!supabase) return
    await supabase
      .from('user_library')
      .update({ last_played_at: new Date().toISOString() })
      .eq('id', libraryId)
      .eq('user_id', userId)
  },

  async getRomBlob(userId, libraryId) {
    if (!supabase) throw new Error('Offline mode')

    const item = await library.get(userId, libraryId)
    if (!item) throw new Error('Game not found in library')

    if (item.storage_type === 'supabase' && item.storage_path) {
      const { data, error } = await supabase.storage
        .from('user_roms')
        .download(item.storage_path)
      if (error) throw error
      return { blob: data, gameInfo: item }
    }

    throw new Error('Cannot load ROM from this storage type')
  }
}

// Favorites
export const favorites = {
  async list(userId) {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async add(userId, gameId, gameName, systemId) {
    if (!supabase) throw new Error('Offline mode')
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        game_id: gameId,
        game_name: gameName,
        system_id: systemId,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(userId, gameId) {
    if (!supabase) throw new Error('Offline mode')
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId)
    if (error) throw error
  },

  async isFavorite(userId, gameId) {
    if (!supabase) return false
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single()
    return !!data
  }
}
