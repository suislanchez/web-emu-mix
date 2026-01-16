// Myrient filename parser utilities

export interface ParsedGame {
  title: string
  region: string | null
  languages: string[]
  version: string | null
  tags: string[]
}

// Map of Myrient paths to app system IDs
export const SYSTEM_MAPPINGS: Record<string, string> = {
  'No-Intro/Nintendo - Nintendo Entertainment System (Headered)': 'nes',
  'No-Intro/Nintendo - Super Nintendo Entertainment System': 'snes',
  'No-Intro/Nintendo - Game Boy': 'gb',
  'No-Intro/Nintendo - Game Boy Color': 'gbc',
  'No-Intro/Nintendo - Game Boy Advance': 'gba',
  'No-Intro/Nintendo - Nintendo DS (Decrypted)': 'nds',
  'No-Intro/Nintendo - Nintendo DS (Encrypted)': 'nds',
  'No-Intro/Nintendo - Nintendo 64 (BigEndian)': 'n64',
  'No-Intro/Sega - Mega Drive - Genesis': 'segaMD',
  'No-Intro/Sega - Master System - Mark III': 'segaMS',
  'No-Intro/Sega - Game Gear': 'segaGG',
  'Redump/Sony - PlayStation': 'psx',
}

// Known regions
const REGIONS = ['USA', 'Europe', 'Japan', 'World', 'Korea', 'China', 'Taiwan', 'Brazil', 'Australia', 'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Russia', 'UK']

// Known language codes
const LANGUAGE_CODES = ['En', 'Ja', 'Fr', 'De', 'Es', 'It', 'Pt', 'Nl', 'Sv', 'No', 'Da', 'Fi', 'Ru', 'Ko', 'Zh']

/**
 * Parse a Myrient filename to extract game metadata
 * Example: "Super Mario Bros. (World) (Rev 1).zip"
 */
export function parseFilename(filename: string): ParsedGame | null {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(zip|7z|rar)$/i, '')

  // Extract all parenthetical content
  const tagMatches = nameWithoutExt.match(/\([^)]+\)/g) || []
  const tags = tagMatches.map(t => t.slice(1, -1)) // Remove parens

  // Get title (everything before first parenthesis)
  const titleMatch = nameWithoutExt.match(/^(.+?)\s*\(/)
  const title = titleMatch ? titleMatch[1].trim() : nameWithoutExt.trim()

  if (!title) return null

  // Extract region
  let region: string | null = null
  for (const tag of tags) {
    const regionMatch = REGIONS.find(r => tag.includes(r))
    if (regionMatch) {
      region = regionMatch
      break
    }
  }

  // Extract languages
  const languages: string[] = []
  for (const tag of tags) {
    // Check for comma-separated language codes like "En,Fr,De"
    const langMatch = tag.match(/^([A-Z][a-z](?:,[A-Z][a-z])*)$/)
    if (langMatch) {
      languages.push(...langMatch[1].split(','))
    }
  }

  // Extract version
  let version: string | null = null
  for (const tag of tags) {
    if (tag.match(/^Rev \d+|^v\d+\.\d+|^Version/i)) {
      version = tag
      break
    }
  }

  return {
    title,
    region,
    languages,
    version,
    tags
  }
}

/**
 * Parse HTML directory listing from Myrient
 */
export function parseDirectoryListing(html: string): Array<{ name: string; size: string }> {
  const results: Array<{ name: string; size: string }> = []

  // Match table rows with file links
  // Myrient uses a standard Apache/nginx directory listing format
  const linkRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
  const sizeRegex = /(\d+(?:\.\d+)?\s*[KMGT]?i?B)/gi

  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const name = decodeURIComponent(href)

    // Skip parent directory and non-file links
    if (name === '../' || name.startsWith('?') || name.endsWith('/')) {
      continue
    }

    // Only include zip files
    if (!name.match(/\.(zip|7z)$/i)) {
      continue
    }

    // Try to find size (simplified - actual implementation may need adjustment)
    results.push({ name, size: '0' })
  }

  return results
}

/**
 * Get the file extension without the dot
 */
export function getExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : 'zip'
}
