// Cover art fetching service using LibRetro thumbnails and fallbacks

// Map system IDs to LibRetro thumbnail database names
const LIBRETRO_SYSTEMS = {
  nes: 'Nintendo - Nintendo Entertainment System',
  snes: 'Nintendo - Super Nintendo Entertainment System',
  gb: 'Nintendo - Game Boy',
  gbc: 'Nintendo - Game Boy Color',
  gba: 'Nintendo - Game Boy Advance',
  nds: 'Nintendo - Nintendo DS',
  n64: 'Nintendo - Nintendo 64',
  segaMD: 'Sega - Mega Drive - Genesis',
  segaMS: 'Sega - Master System - Mark III',
  segaGG: 'Sega - Game Gear',
  psx: 'Sony - PlayStation',
  arcade: 'FBNeo - Arcade Games',
}

// Cache for cover art URLs (persisted to localStorage)
const CACHE_KEY = 'retroplay_cover_cache'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return {}
    const data = JSON.parse(cached)
    // Clean expired entries
    const now = Date.now()
    Object.keys(data).forEach(key => {
      if (data[key].expires < now) delete data[key]
    })
    return data
  } catch {
    return {}
  }
}

function setCache(key, url) {
  try {
    const cache = getCache()
    cache[key] = { url, expires: Date.now() + CACHE_EXPIRY }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Storage full or unavailable
  }
}

function getCachedUrl(key) {
  const cache = getCache()
  return cache[key]?.url || null
}

// Normalize game name for matching
function normalizeGameName(name) {
  return name
    .replace(/\([^)]*\)/g, '') // Remove (USA), (Europe), etc.
    .replace(/\[[^\]]*\]/g, '') // Remove [!], [b], etc.
    .replace(/\.[^.]+$/, '') // Remove file extension
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphen
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

// Generate search variations of the game name
function getNameVariations(name) {
  const normalized = normalizeGameName(name)
  const variations = [normalized]

  // Try with "The" moved to end
  if (normalized.toLowerCase().startsWith('the ')) {
    variations.push(normalized.slice(4) + ', The')
  }

  // Try without subtitle (after colon or hyphen)
  const colonIdx = normalized.indexOf(':')
  if (colonIdx > 0) variations.push(normalized.slice(0, colonIdx).trim())

  const hyphenIdx = normalized.indexOf(' - ')
  if (hyphenIdx > 0) variations.push(normalized.slice(0, hyphenIdx).trim())

  return variations
}

// Build LibRetro thumbnail URL
function buildLibRetroUrl(systemId, gameName, type = 'Named_Boxarts') {
  const system = LIBRETRO_SYSTEMS[systemId]
  if (!system) return null

  // LibRetro uses URL-encoded names with underscores for special chars
  const encodedName = encodeURIComponent(gameName)
    .replace(/%20/g, '_')
    .replace(/'/g, '%27')

  return `https://thumbnails.libretro.com/${encodeURIComponent(system)}/${type}/${encodedName}.png`
}

// Check if an image URL exists
async function imageExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

// Try to load an image and return a promise
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(url)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// Fetch cover art for a game
export async function fetchCoverArt(gameName, systemId) {
  const cacheKey = `${systemId}:${gameName.toLowerCase()}`

  // Check cache first
  const cached = getCachedUrl(cacheKey)
  if (cached) return cached

  const variations = getNameVariations(gameName)

  // Try LibRetro thumbnails with different name variations
  for (const variant of variations) {
    // Try Named_Boxarts first (front box art)
    const boxartUrl = buildLibRetroUrl(systemId, variant, 'Named_Boxarts')
    if (boxartUrl) {
      try {
        await loadImage(boxartUrl)
        setCache(cacheKey, boxartUrl)
        return boxartUrl
      } catch {
        // Try with underscores replaced by spaces
        const altUrl = boxartUrl.replace(/_/g, '%20')
        try {
          await loadImage(altUrl)
          setCache(cacheKey, altUrl)
          return altUrl
        } catch {
          // Continue to next variation
        }
      }
    }

    // Try Named_Snaps (screenshots) as fallback
    const snapUrl = buildLibRetroUrl(systemId, variant, 'Named_Snaps')
    if (snapUrl) {
      try {
        await loadImage(snapUrl)
        setCache(cacheKey, snapUrl)
        return snapUrl
      } catch {
        // Continue to next variation
      }
    }

    // Try Named_Titles (title screens) as last resort
    const titleUrl = buildLibRetroUrl(systemId, variant, 'Named_Titles')
    if (titleUrl) {
      try {
        await loadImage(titleUrl)
        setCache(cacheKey, titleUrl)
        return titleUrl
      } catch {
        // Continue to next variation
      }
    }
  }

  // No cover found - cache null to avoid repeated lookups
  setCache(cacheKey, null)
  return null
}

// Batch fetch cover art for multiple games
export async function fetchMultipleCoverArts(games) {
  const results = await Promise.allSettled(
    games.map(game =>
      fetchCoverArt(game.name, game.systemId)
        .then(url => ({ gameId: game.gameId, coverUrl: url }))
    )
  )

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
}

// Clear the cover art cache
export function clearCoverCache() {
  localStorage.removeItem(CACHE_KEY)
}
