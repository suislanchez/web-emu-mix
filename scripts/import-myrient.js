#!/usr/bin/env node
/**
 * Myrient Game Catalog Importer
 * Scrapes Myrient's directory listings and imports games into Supabase
 */

import { createClient } from '@supabase/supabase-js'

// Supabase config - use environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jizznieevayhpylfnxaj.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Myrient paths for each system
const MYRIENT_SOURCES = {
  nes: {
    name: 'NES',
    path: 'No-Intro/Nintendo - Nintendo Entertainment System (Headered)',
    extensions: ['.nes']
  },
  snes: {
    name: 'SNES',
    path: 'No-Intro/Nintendo - Super Nintendo Entertainment System',
    extensions: ['.sfc', '.smc']
  },
  gb: {
    name: 'Game Boy',
    path: 'No-Intro/Nintendo - Game Boy',
    extensions: ['.gb']
  },
  gbc: {
    name: 'Game Boy Color',
    path: 'No-Intro/Nintendo - Game Boy Color',
    extensions: ['.gbc']
  },
  gba: {
    name: 'GBA',
    path: 'No-Intro/Nintendo - Game Boy Advance',
    extensions: ['.gba']
  },
  nds: {
    name: 'Nintendo DS',
    path: 'No-Intro/Nintendo - Nintendo DS (Decrypted)',
    extensions: ['.nds']
  },
  n64: {
    name: 'N64',
    path: 'No-Intro/Nintendo - Nintendo 64 (BigEndian)',
    extensions: ['.z64', '.n64']
  },
  segaMD: {
    name: 'Genesis',
    path: 'No-Intro/Sega - Mega Drive - Genesis',
    extensions: ['.md', '.gen']
  },
  segaMS: {
    name: 'Master System',
    path: 'No-Intro/Sega - Master System - Mark III',
    extensions: ['.sms']
  },
  segaGG: {
    name: 'Game Gear',
    path: 'No-Intro/Sega - Game Gear',
    extensions: ['.gg']
  },
  psx: {
    name: 'PlayStation',
    path: 'Redump/Sony - PlayStation',
    extensions: ['.chd', '.bin', '.cue']
  }
}

// Parse game title from filename
function parseGameTitle(filename) {
  // Remove file extension
  let title = filename.replace(/\.(zip|7z|nes|sfc|smc|gb|gbc|gba|nds|z64|n64|md|gen|sms|gg|chd|bin|cue)$/i, '')

  // Extract region from parentheses
  const regionMatch = title.match(/\((USA|Europe|Japan|World|USA, Europe|Europe, USA|Japan, USA)[^)]*\)/i)
  const region = regionMatch ? regionMatch[1].split(',')[0].trim() : null

  // Remove tags in parentheses and brackets for clean title
  const cleanTitle = title
    .replace(/\s*\([^)]+\)/g, '') // Remove (tags)
    .replace(/\s*\[[^\]]+\]/g, '') // Remove [tags]
    .trim()

  return { title: cleanTitle, region, originalName: filename }
}

// Fetch directory listing from Myrient
async function fetchMyrientListing(path) {
  const url = `https://myrient.erista.me/files/${encodeURIComponent(path).replace(/%2F/g, '/')}/`
  console.log(`Fetching: ${url}`)

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Parse HTML to extract file links
    // Myrient uses a simple directory listing with <a> tags
    const files = []
    const linkRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    let match

    while ((match = linkRegex.exec(html)) !== null) {
      const href = decodeURIComponent(match[1])
      const name = match[2]

      // Skip parent directory and non-game files
      if (href === '../' || name === 'Parent Directory') continue
      if (href.endsWith('/')) continue // Skip subdirectories

      // Only include ROM files (zip, 7z, or raw ROM extensions)
      if (href.match(/\.(zip|7z|nes|sfc|smc|gb|gbc|gba|nds|z64|n64|md|gen|sms|gg|chd)$/i)) {
        files.push(href)
      }
    }

    return files
  } catch (err) {
    console.error(`Failed to fetch ${path}:`, err.message)
    return []
  }
}

// Import games for a single system
async function importSystem(systemId, config) {
  console.log(`\n=== Importing ${config.name} (${systemId}) ===`)

  const files = await fetchMyrientListing(config.path)
  console.log(`Found ${files.length} files`)

  if (files.length === 0) {
    console.log('No files found, skipping')
    return 0
  }

  // Parse all files
  const games = files.map(filename => {
    const { title, region, originalName } = parseGameTitle(filename)
    return {
      title,
      system_id: systemId,
      region,
      myrient_path: `${config.path}/${filename}`,
      file_size: null, // Could parse from listing if available
      created_at: new Date().toISOString()
    }
  })

  // Filter out duplicates (same title + region)
  const seen = new Set()
  const uniqueGames = games.filter(game => {
    const key = `${game.title}|${game.region}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`Unique games: ${uniqueGames.length}`)

  // Insert in batches of 500
  const batchSize = 500
  let imported = 0

  for (let i = 0; i < uniqueGames.length; i += batchSize) {
    const batch = uniqueGames.slice(i, i + batchSize)

    const { error } = await supabase
      .from('game_catalog')
      .upsert(batch, {
        onConflict: 'title,system_id,region',
        ignoreDuplicates: true
      })

    if (error) {
      console.error(`Batch insert error:`, error.message)
    } else {
      imported += batch.length
      console.log(`Imported ${imported}/${uniqueGames.length}`)
    }
  }

  return imported
}

// Add unique constraint for upsert
async function ensureConstraint() {
  // This might fail if constraint exists, that's ok
  try {
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE game_catalog
        ADD CONSTRAINT game_catalog_unique_game
        UNIQUE NULLS NOT DISTINCT (title, system_id, region)
      `
    })
  } catch (e) {
    // Constraint might already exist
  }
}

// Main import function
async function main() {
  const args = process.argv.slice(2)
  const systemsToImport = args.length > 0 ? args : Object.keys(MYRIENT_SOURCES)

  console.log('Myrient Game Catalog Importer')
  console.log('============================')
  console.log(`Systems to import: ${systemsToImport.join(', ')}`)

  let totalImported = 0

  for (const systemId of systemsToImport) {
    const config = MYRIENT_SOURCES[systemId]
    if (!config) {
      console.log(`Unknown system: ${systemId}`)
      continue
    }

    const count = await importSystem(systemId, config)
    totalImported += count
  }

  console.log(`\n============================`)
  console.log(`Total games imported: ${totalImported}`)

  // Show final count
  const { count } = await supabase
    .from('game_catalog')
    .select('*', { count: 'exact', head: true })

  console.log(`Total games in catalog: ${count}`)
}

main().catch(console.error)
