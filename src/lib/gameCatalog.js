// Game Catalog API
// Search and filter games from the catalog

import { supabase } from './supabase.js'

/**
 * Search the game catalog with filters and pagination
 */
export async function searchCatalog({
  query = '',
  system = null,
  genre = null,
  region = null,
  series = null,
  sortBy = 'title',
  sortAsc = true,
  page = 0,
  pageSize = 50
} = {}) {
  if (!supabase) return { games: [], total: 0 }

  try {
    // Use the custom RPC function for efficient search
    const { data, error } = await supabase.rpc('search_game_catalog', {
      search_query: query || null,
      system_filter: system || null,
      genre_filter: genre || null,
      region_filter: region || null,
      series_filter: series || null,
      sort_by: sortBy,
      sort_asc: sortAsc,
      page_num: page,
      page_size: pageSize
    })

    if (error) {
      console.error('Search error:', error)
      throw error
    }

    // Extract total count from first result
    const total = data?.[0]?.total_count || 0

    // Remove total_count from each result
    const games = (data || []).map(({ total_count, ...game }) => game)

    return { games, total }
  } catch (err) {
    console.error('Catalog search failed:', err)
    return { games: [], total: 0 }
  }
}

/**
 * Get a single game by ID
 */
export async function getGameById(gameId) {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('game_catalog')
    .select('*')
    .eq('id', gameId)
    .single()

  if (error) {
    console.error('Get game error:', error)
    return null
  }

  return data
}

/**
 * Get games by system
 */
export async function getGamesBySystem(systemId, limit = 50) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('game_catalog')
    .select('*')
    .eq('system_id', systemId)
    .order('title')
    .limit(limit)

  if (error) {
    console.error('Get by system error:', error)
    return []
  }

  return data || []
}

/**
 * Get available genres with counts
 */
export async function getGenres() {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_distinct_genres')

  if (error) {
    console.error('Get genres error:', error)
    return []
  }

  return data || []
}

/**
 * Get available series with counts
 */
export async function getSeries() {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_distinct_series')

  if (error) {
    console.error('Get series error:', error)
    return []
  }

  return data || []
}

/**
 * Get catalog statistics
 */
export async function getCatalogStats() {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('game_catalog')
    .select('system_id', { count: 'exact' })

  if (error) {
    console.error('Get stats error:', error)
    return null
  }

  // Group by system
  const bySystem = {}
  for (const row of data || []) {
    bySystem[row.system_id] = (bySystem[row.system_id] || 0) + 1
  }

  return {
    total: data?.length || 0,
    bySystem
  }
}

/**
 * Request IGDB metadata for a game (triggers background fetch)
 */
export async function requestMetadata(gameId, title, systemId) {
  if (!supabase) return false

  try {
    const { error } = await supabase.functions.invoke('igdb-metadata', {
      body: { catalogId: gameId, title, systemId }
    })

    return !error
  } catch (err) {
    console.error('Metadata request failed:', err)
    return false
  }
}

/**
 * Get the direct Myrient download URL for a game
 */
export function getMyrientUrl(myrientPath) {
  return `https://myrient.erista.me/files/${encodeURIComponent(myrientPath).replace(/%2F/g, '/')}`
}

// System display info
export const SYSTEM_INFO = {
  nes: { name: 'NES', icon: null, color: '#e60012' },
  snes: { name: 'SNES', icon: null, color: '#7b5aa6' },
  gb: { name: 'Game Boy', icon: null, color: '#8b956d' },
  gbc: { name: 'Game Boy Color', icon: null, color: '#6b2f87' },
  gba: { name: 'GBA', icon: null, color: '#4f4789' },
  nds: { name: 'Nintendo DS', icon: null, color: '#cccccc' },
  n64: { name: 'N64', icon: null, color: '#009e60' },
  segaMD: { name: 'Genesis', icon: null, color: '#0057a8' },
  segaMS: { name: 'Master System', icon: null, color: '#ff0000' },
  segaGG: { name: 'Game Gear', icon: null, color: '#1a1a1a' },
  psx: { name: 'PlayStation', icon: null, color: '#003087' },
  arcade: { name: 'Arcade', icon: null, color: '#ff6600' }
}
