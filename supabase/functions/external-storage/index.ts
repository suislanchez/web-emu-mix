// External Storage Edge Function
// Handles file operations with Google Drive and Dropbox

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

const MYRIENT_BASE = 'https://myrient.erista.me/files/'

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'refresh_token'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Google token')
  }

  const data = await response.json()
  return data.access_token
}

async function refreshDropboxToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('DROPBOX_CLIENT_ID')
  const clientSecret = Deno.env.get('DROPBOX_CLIENT_SECRET')

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'refresh_token'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Dropbox token')
  }

  const data = await response.json()
  return data.access_token
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Verify user authentication
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const { action, provider, myrientPath, catalogId, fileId } = body

    // Get user's storage connection
    const { data: connection, error: connError } = await supabase
      .from('external_storage_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single()

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Storage not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token needs refresh
    let accessToken = connection.access_token
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      if (!connection.refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Token expired, reconnection required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      accessToken = provider === 'google_drive'
        ? await refreshGoogleToken(connection.refresh_token)
        : await refreshDropboxToken(connection.refresh_token)

      // Update stored token
      await supabase
        .from('external_storage_connections')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
        })
        .eq('id', connection.id)
    }

    // Handle different actions
    if (action === 'upload' && myrientPath && catalogId) {
      // Download from Myrient and upload to external storage
      const myrientUrl = MYRIENT_BASE + myrientPath
      const filename = myrientPath.split('/').pop() || 'game.zip'

      // Update library status
      await supabase
        .from('user_library')
        .upsert({
          user_id: user.id,
          catalog_id: catalogId,
          storage_type: provider,
          download_status: 'downloading',
          download_progress: 0,
          added_at: new Date().toISOString()
        }, { onConflict: 'user_id,catalog_id,storage_type' })

      // Fetch from Myrient
      const myrientResponse = await fetch(myrientUrl)
      if (!myrientResponse.ok) {
        await supabase
          .from('user_library')
          .update({ download_status: 'failed' })
          .eq('user_id', user.id)
          .eq('catalog_id', catalogId)

        return new Response(
          JSON.stringify({ error: 'Failed to fetch from Myrient' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const fileBuffer = await myrientResponse.arrayBuffer()
      const contentLength = fileBuffer.byteLength

      let storageFileId: string | null = null
      let storagePath: string | null = null

      if (provider === 'google_drive') {
        // Upload to Google Drive
        const metadata = {
          name: filename,
          parents: connection.app_folder_id ? [connection.app_folder_id] : []
        }

        const form = new FormData()
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
        form.append('file', new Blob([fileBuffer]))

        const uploadResponse = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: form
          }
        )

        if (!uploadResponse.ok) {
          const error = await uploadResponse.text()
          console.error('Google Drive upload failed:', error)
          await supabase
            .from('user_library')
            .update({ download_status: 'failed' })
            .eq('user_id', user.id)
            .eq('catalog_id', catalogId)

          return new Response(
            JSON.stringify({ error: 'Failed to upload to Google Drive' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const uploadResult = await uploadResponse.json()
        storageFileId = uploadResult.id
        storagePath = `${connection.app_folder_path}/${filename}`

      } else if (provider === 'dropbox') {
        // Upload to Dropbox
        const path = `${connection.app_folder_path}/${filename}`

        const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              path,
              mode: 'overwrite',
              autorename: false
            })
          },
          body: fileBuffer
        })

        if (!uploadResponse.ok) {
          const error = await uploadResponse.text()
          console.error('Dropbox upload failed:', error)
          await supabase
            .from('user_library')
            .update({ download_status: 'failed' })
            .eq('user_id', user.id)
            .eq('catalog_id', catalogId)

          return new Response(
            JSON.stringify({ error: 'Failed to upload to Dropbox' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const uploadResult = await uploadResponse.json()
        storageFileId = uploadResult.id
        storagePath = path
      }

      // Update library entry
      await supabase
        .from('user_library')
        .update({
          storage_file_id: storageFileId,
          storage_path: storagePath,
          file_size: contentLength,
          download_status: 'completed',
          download_progress: 100
        })
        .eq('user_id', user.id)
        .eq('catalog_id', catalogId)
        .eq('storage_type', provider)

      return new Response(
        JSON.stringify({
          success: true,
          storageFileId,
          storagePath,
          fileSize: contentLength
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'download' && fileId) {
      // Download file from external storage
      let fileContent: ArrayBuffer

      if (provider === 'google_drive') {
        const downloadResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        )

        if (!downloadResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to download from Google Drive' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        fileContent = await downloadResponse.arrayBuffer()

      } else if (provider === 'dropbox') {
        // For Dropbox, fileId is actually the path
        const downloadResponse = await fetch('https://content.dropboxapi.com/2/files/download', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Dropbox-API-Arg': JSON.stringify({ path: fileId })
          }
        })

        if (!downloadResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to download from Dropbox' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        fileContent = await downloadResponse.arrayBuffer()
      } else {
        return new Response(
          JSON.stringify({ error: 'Unsupported provider' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Return as base64
      const base64 = btoa(String.fromCharCode(...new Uint8Array(fileContent)))

      return new Response(
        JSON.stringify({ success: true, content: base64 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete' && fileId) {
      if (provider === 'google_drive') {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      } else if (provider === 'dropbox') {
        await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ path: fileId })
        })
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('External storage error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
