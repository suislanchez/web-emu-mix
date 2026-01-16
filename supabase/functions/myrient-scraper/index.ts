// Myrient Scraper Edge Function
// Indexes games from myrient.erista.me directory listings

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { parseFilename, getExtension, SYSTEM_MAPPINGS } from '../_shared/myrient-parser.ts'

const MYRIENT_BASE = 'https://myrient.erista.me/files/'

interface ScrapedGame {
  myrient_path: string
  title: string
  system_id: string
  region: string | null
  languages: string[]
  version: string | null
  file_extension: string
}

async function scrapeDirectory(path: string, systemId: string): Promise<ScrapedGame[]> {
  const url = MYRIENT_BASE + encodeURIComponent(path).replace(/%2F/g, '/')
  console.log(`Scraping: ${url}`)

  const response = await fetch(url)
  if (!response.ok) {
    console.error(`Failed to fetch ${url}: ${response.status}`)
    return []
  }

  const html = await response.text()
  const games: ScrapedGame[] = []

  // Parse HTML to find file links
  // Myrient uses standard directory listing with <a href="filename">
  const linkRegex = /<a href="([^"]+\.(zip|7z))"[^>]*>/gi
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const filename = decodeURIComponent(href)

    // Skip parent directory
    if (filename.startsWith('..') || filename.startsWith('/')) {
      continue
    }

    const parsed = parseFilename(filename)
    if (!parsed) continue

    games.push({
      myrient_path: `${path}/${filename}`,
      title: parsed.title,
      system_id: systemId,
      region: parsed.region,
      languages: parsed.languages,
      version: parsed.version,
      file_extension: getExtension(filename)
    })
  }

  console.log(`Found ${games.length} games in ${path}`)
  return games
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // Verify authorization (admin/service role only)
  const authHeader = req.headers.get('Authorization')
  const scraperSecret = Deno.env.get('SCRAPER_SECRET')

  if (!scraperSecret || authHeader !== `Bearer ${scraperSecret}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const body = await req.json()
    const { system, limit = 1000 } = body

    let totalIndexed = 0
    const errors: string[] = []

    // Process requested systems or all systems
    const systemsToProcess = system
      ? Object.entries(SYSTEM_MAPPINGS).filter(([_, id]) => id === system)
      : Object.entries(SYSTEM_MAPPINGS)

    for (const [myrientPath, systemId] of systemsToProcess) {
      try {
        const games = await scrapeDirectory(myrientPath, systemId)

        if (games.length === 0) {
          console.log(`No games found for ${systemId}`)
          continue
        }

        // Batch upsert in chunks of 500
        const chunkSize = 500
        for (let i = 0; i < Math.min(games.length, limit); i += chunkSize) {
          const chunk = games.slice(i, i + chunkSize)

          const { error } = await supabase
            .from('game_catalog')
            .upsert(chunk, {
              onConflict: 'myrient_path',
              ignoreDuplicates: false
            })

          if (error) {
            console.error(`Error upserting chunk for ${systemId}:`, error)
            errors.push(`${systemId}: ${error.message}`)
          } else {
            totalIndexed += chunk.length
          }
        }

        console.log(`Indexed ${Math.min(games.length, limit)} games for ${systemId}`)

        // Rate limit between systems
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (err) {
        console.error(`Error processing ${systemId}:`, err)
        errors.push(`${systemId}: ${err.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        indexed: totalIndexed,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Scraper error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
