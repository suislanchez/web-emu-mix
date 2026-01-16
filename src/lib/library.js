// Library management - favorites, collections, search, filter
const FAVORITES_KEY = 'pixelvault_favorites'
const COLLECTIONS_KEY = 'pixelvault_collections'
const GAME_NOTES_KEY = 'pixelvault_notes'
const SCREENSHOTS_KEY = 'pixelvault_screenshots'

// ============================================
// FAVORITES
// ============================================
export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

export function isFavorite(gameId) {
  return getFavorites().includes(gameId)
}

export function toggleFavorite(gameId) {
  const favorites = getFavorites()
  const index = favorites.indexOf(gameId)
  if (index === -1) {
    favorites.push(gameId)
  } else {
    favorites.splice(index, 1)
  }
  saveFavorites(favorites)
  return index === -1 // returns true if added, false if removed
}

// ============================================
// COLLECTIONS
// ============================================
export function getCollections() {
  try {
    return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveCollections(collections) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections))
}

export function createCollection(name, icon = 'folder') {
  const collections = getCollections()
  const id = `col_${Date.now()}`
  collections.push({ id, name, icon, games: [], createdAt: Date.now() })
  saveCollections(collections)
  return id
}

export function deleteCollection(collectionId) {
  const collections = getCollections().filter(c => c.id !== collectionId)
  saveCollections(collections)
}

export function renameCollection(collectionId, newName) {
  const collections = getCollections()
  const col = collections.find(c => c.id === collectionId)
  if (col) {
    col.name = newName
    saveCollections(collections)
  }
}

export function addToCollection(collectionId, gameId) {
  const collections = getCollections()
  const col = collections.find(c => c.id === collectionId)
  if (col && !col.games.includes(gameId)) {
    col.games.push(gameId)
    saveCollections(collections)
  }
}

export function removeFromCollection(collectionId, gameId) {
  const collections = getCollections()
  const col = collections.find(c => c.id === collectionId)
  if (col) {
    col.games = col.games.filter(g => g !== gameId)
    saveCollections(collections)
  }
}

export function getGameCollections(gameId) {
  return getCollections().filter(c => c.games.includes(gameId))
}

// ============================================
// SEARCH & FILTER
// ============================================
export function filterGames(games, { search = '', system = 'all', sortBy = 'recent', favoritesOnly = false }) {
  let filtered = [...games]

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase()
    filtered = filtered.filter(g =>
      g.name.toLowerCase().includes(searchLower) ||
      g.systemName?.toLowerCase().includes(searchLower)
    )
  }

  // System filter
  if (system !== 'all') {
    filtered = filtered.filter(g => g.systemId === system)
  }

  // Favorites only
  if (favoritesOnly) {
    const favorites = getFavorites()
    filtered = filtered.filter(g => favorites.includes(g.gameId))
  }

  // Sort
  switch (sortBy) {
    case 'recent':
      filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      break
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'system':
      filtered.sort((a, b) => a.systemId.localeCompare(b.systemId))
      break
    case 'playtime':
      filtered.sort((a, b) => (b.playtime || 0) - (a.playtime || 0))
      break
  }

  return filtered
}

// ============================================
// RANDOM PICKER
// ============================================
export function getRandomGame(games, { system = 'all', favoritesOnly = false } = {}) {
  let filtered = filterGames(games, { system, favoritesOnly, sortBy: 'recent' })
  if (filtered.length === 0) return null
  return filtered[Math.floor(Math.random() * filtered.length)]
}

// ============================================
// GAME NOTES
// ============================================
export function getGameNotes(gameId) {
  try {
    const notes = JSON.parse(localStorage.getItem(GAME_NOTES_KEY) || '{}')
    return notes[gameId] || ''
  } catch {
    return ''
  }
}

export function saveGameNotes(gameId, note) {
  try {
    const notes = JSON.parse(localStorage.getItem(GAME_NOTES_KEY) || '{}')
    if (note.trim()) {
      notes[gameId] = note
    } else {
      delete notes[gameId]
    }
    localStorage.setItem(GAME_NOTES_KEY, JSON.stringify(notes))
  } catch (e) {
    console.error('Failed to save notes:', e)
  }
}

// ============================================
// SCREENSHOTS
// ============================================
export function getScreenshots(gameId = null) {
  try {
    const screenshots = JSON.parse(localStorage.getItem(SCREENSHOTS_KEY) || '[]')
    if (gameId) {
      return screenshots.filter(s => s.gameId === gameId)
    }
    return screenshots
  } catch {
    return []
  }
}

export function saveScreenshot(gameId, gameName, dataUrl) {
  try {
    const screenshots = JSON.parse(localStorage.getItem(SCREENSHOTS_KEY) || '[]')
    screenshots.unshift({
      id: `ss_${Date.now()}`,
      gameId,
      gameName,
      dataUrl,
      timestamp: Date.now()
    })
    // Keep only last 50 screenshots
    const trimmed = screenshots.slice(0, 50)
    localStorage.setItem(SCREENSHOTS_KEY, JSON.stringify(trimmed))
    return trimmed[0]
  } catch (e) {
    console.error('Failed to save screenshot:', e)
    return null
  }
}

export function deleteScreenshot(screenshotId) {
  try {
    const screenshots = JSON.parse(localStorage.getItem(SCREENSHOTS_KEY) || '[]')
    const filtered = screenshots.filter(s => s.id !== screenshotId)
    localStorage.setItem(SCREENSHOTS_KEY, JSON.stringify(filtered))
  } catch (e) {
    console.error('Failed to delete screenshot:', e)
  }
}

// ============================================
// PLAY STATS
// ============================================
const STATS_KEY = 'pixelvault_stats'

export function getPlayStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
  } catch {
    return {}
  }
}

export function updatePlayStats(gameId, systemId, playtimeSeconds) {
  const stats = getPlayStats()

  if (!stats.games) stats.games = {}
  if (!stats.systems) stats.systems = {}
  if (!stats.daily) stats.daily = {}

  // Update game stats
  if (!stats.games[gameId]) {
    stats.games[gameId] = { playtime: 0, sessions: 0, lastPlayed: null }
  }
  stats.games[gameId].playtime += playtimeSeconds
  stats.games[gameId].sessions += 1
  stats.games[gameId].lastPlayed = Date.now()

  // Update system stats
  if (!stats.systems[systemId]) {
    stats.systems[systemId] = { playtime: 0, sessions: 0 }
  }
  stats.systems[systemId].playtime += playtimeSeconds
  stats.systems[systemId].sessions += 1

  // Update daily stats
  const today = new Date().toISOString().split('T')[0]
  if (!stats.daily[today]) {
    stats.daily[today] = { playtime: 0, sessions: 0 }
  }
  stats.daily[today].playtime += playtimeSeconds
  stats.daily[today].sessions += 1

  // Update totals
  stats.totalPlaytime = (stats.totalPlaytime || 0) + playtimeSeconds
  stats.totalSessions = (stats.totalSessions || 0) + 1

  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  return stats
}

export function formatPlaytime(seconds) {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

// ============================================
// HIGH SCORES / LEADERBOARDS
// ============================================
const HIGHSCORES_KEY = 'pixelvault_highscores'

export function getHighScores(gameId = null) {
  try {
    const scores = JSON.parse(localStorage.getItem(HIGHSCORES_KEY) || '{}')
    if (gameId) {
      return scores[gameId] || []
    }
    return scores
  } catch {
    return gameId ? [] : {}
  }
}

export function addHighScore(gameId, gameName, score, playerName = 'Player') {
  try {
    const allScores = JSON.parse(localStorage.getItem(HIGHSCORES_KEY) || '{}')
    if (!allScores[gameId]) {
      allScores[gameId] = []
    }

    const newScore = {
      id: `hs_${Date.now()}`,
      playerName: playerName.substring(0, 20),
      score,
      gameName,
      timestamp: Date.now()
    }

    allScores[gameId].push(newScore)
    // Sort by score descending and keep top 10
    allScores[gameId].sort((a, b) => b.score - a.score)
    allScores[gameId] = allScores[gameId].slice(0, 10)

    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(allScores))
    return allScores[gameId]
  } catch (e) {
    console.error('Failed to save high score:', e)
    return []
  }
}

export function deleteHighScore(gameId, scoreId) {
  try {
    const allScores = JSON.parse(localStorage.getItem(HIGHSCORES_KEY) || '{}')
    if (allScores[gameId]) {
      allScores[gameId] = allScores[gameId].filter(s => s.id !== scoreId)
      localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(allScores))
    }
  } catch (e) {
    console.error('Failed to delete high score:', e)
  }
}

export function clearHighScores(gameId) {
  try {
    const allScores = JSON.parse(localStorage.getItem(HIGHSCORES_KEY) || '{}')
    delete allScores[gameId]
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(allScores))
  } catch (e) {
    console.error('Failed to clear high scores:', e)
  }
}

export function getAllHighScores() {
  const allScores = getHighScores()
  const combined = []
  for (const [gameId, scores] of Object.entries(allScores)) {
    scores.forEach(score => {
      combined.push({ ...score, gameId })
    })
  }
  return combined.sort((a, b) => b.score - a.score)
}
