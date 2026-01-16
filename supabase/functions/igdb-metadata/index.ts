// IGDB Metadata Edge Function
// Fetches game metadata from IGDB (Twitch) API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// IGDB platform IDs mapped to our system IDs
const PLATFORM_MAP: Record<string, number> = {
  nes: 18,
  snes: 19,
  gb: 33,
  gbc: 22,
  gba: 24,
  nds: 20,
  n64: 4,
  segaMD: 29,
  segaMS: 64,
  segaGG: 35,
  psx: 7,
  arcade: 52,
}

let accessToken: string | null = null
let tokenExpiry = 0

async function getIGDBToken(): Promise<string> {
  const now = Date.now()

  if (accessToken && now < tokenExpiry) {
    return accessToken
  }

  const clientId = Deno.env.get('IGDB_CLIENT_ID')
  const clientSecret = Deno.env.get('IGDB_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('IGDB credentials not configured')
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )

  if (!response.ok) {
    throw new Error('Failed to get IGDB access token')
  }

  const data = await response.json()
  accessToken = data.access_token
  tokenExpiry = now + (data.expires_in * 1000) - 60000 // Refresh 1 min early

  return accessToken!
}

async function searchIGDB(title: string, platformId: number): Promise<any | null> {
  const token = await getIGDBToken()
  const clientId = Deno.env.get('IGDB_CLIENT_ID')!

  // Clean up title for better matching
  const cleanTitle = title
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical content
    .replace(/[^\w\s]/g, ' ') // Remove special chars
    .trim()

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain'
    },
    body: `
      search "${cleanTitle}";
      fields name, summary, genres.name, collection.name, first_release_date,
             involved_companies.company.name, involved_companies.developer,
             involved_companies.publisher, cover.url, rating;
      where platforms = (${platformId});
      limit 1;
    `
  })

  if (!response.ok) {
    console.error('IGDB search failed:', await response.text())
    return null
  }

  const results = await response.json()
  return results[0] || null
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const body = await req.json()
    const { catalogId, title, systemId, batch = false } = body

    // Single game lookup
    if (catalogId && title && systemId) {
      const platformId = PLATFORM_MAP[systemId]

      if (!platformId) {
        return new Response(
          JSON.stringify({ error: 'Unknown platform', systemId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const igdbData = await searchIGDB(title, platformId)

      if (igdbData) {
        const developer = igdbData.involved_companies?.find((c: any) => c.developer)?.company?.name
        const publisher = igdbData.involved_companies?.find((c: any) => c.publisher)?.company?.name

        const updates = {
          igdb_id: igdbData.id,
          description: igdbData.summary || null,
          genres: igdbData.genres?.map((g: any) => g.name) || [],
          series: igdbData.collection?.name || null,
          release_date: igdbData.first_release_date
            ? new Date(igdbData.first_release_date * 1000).toISOString().split('T')[0]
            : null,
          developer: developer || null,
          publisher: publisher || null,
          cover_url: igdbData.cover?.url?.replace('t_thumb', 't_cover_big') || null,
          igdb_rating: igdbData.rating || null,
          metadata_updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('game_catalog')
          .update(updates)
          .eq('id', catalogId)

        if (error) {
          console.error('Update error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to update catalog' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, found: true, igdbId: igdbData.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, found: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Batch processing mode
    if (batch) {
      const { systemId: batchSystem, limit = 100 } = body

      // Get games without metadata
      let query = supabase
        .from('game_catalog')
        .select('id, title, system_id')
        .is('igdb_id', null)
        .limit(limit)

      if (batchSystem) {
        query = query.eq('system_id', batchSystem)
      }

      const { data: games, error } = await query

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch games' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let updated = 0
      let notFound = 0

      for (const game of games || []) {
        const platformId = PLATFORM_MAP[game.system_id]
        if (!platformId) continue

        try {
          const igdbData = await searchIGDB(game.title, platformId)

          if (igdbData) {
            const developer = igdbData.involved_companies?.find((c: any) => c.developer)?.company?.name
            const publisher = igdbData.involved_companies?.find((c: any) => c.publisher)?.company?.name

            await supabase
              .from('game_catalog')
              .update({
                igdb_id: igdbData.id,
                description: igdbData.summary || null,
                genres: igdbData.genres?.map((g: any) => g.name) || [],
                series: igdbData.collection?.name || null,
                release_date: igdbData.first_release_date
                  ? new Date(igdbData.first_release_date * 1000).toISOString().split('T')[0]
                  : null,
                developer: developer || null,
                publisher: publisher || null,
                cover_url: igdbData.cover?.url?.replace('t_thumb', 't_cover_big') || null,
                igdb_rating: igdbData.rating || null,
                metadata_updated_at: new Date().toISOString()
              })
              .eq('id', game.id)

            updated++
          } else {
            notFound++
          }

          // Rate limit: IGDB allows 4 requests per second
          await new Promise(resolve => setTimeout(resolve, 260))

        } catch (err) {
          console.error(`Error processing ${game.title}:`, err)
        }
      }

      return new Response(
        JSON.stringify({ success: true, processed: games?.length || 0, updated, notFound }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request parameters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('IGDB metadata error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
