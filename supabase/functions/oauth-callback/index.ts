// OAuth Callback Edge Function
// Handles OAuth callbacks from Google Drive and Dropbox

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

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
    const { code, provider, redirectUri } = body

    if (!code || !provider) {
      return new Response(
        JSON.stringify({ error: 'Missing code or provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let tokens: any
    let accountEmail: string | null = null

    if (provider === 'google_drive') {
      // Exchange code for Google tokens
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        console.error('Google token exchange failed:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to exchange Google code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      tokens = await tokenResponse.json()

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      })

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json()
        accountEmail = userInfo.email
      }

      // Create RetroPlay folder in Google Drive
      const folderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'RetroPlay ROMs',
          mimeType: 'application/vnd.google-apps.folder'
        })
      })

      let appFolderId: string | null = null
      if (folderResponse.ok) {
        const folder = await folderResponse.json()
        appFolderId = folder.id
      }

      // Store connection
      const { error } = await supabase
        .from('external_storage_connections')
        .upsert({
          user_id: user.id,
          provider: 'google_drive',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          account_email: accountEmail,
          app_folder_id: appFolderId,
          app_folder_path: '/RetroPlay ROMs',
          connected_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' })

      if (error) {
        console.error('Failed to store connection:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to store connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

    } else if (provider === 'dropbox') {
      // Exchange code for Dropbox tokens
      const clientId = Deno.env.get('DROPBOX_CLIENT_ID')
      const clientSecret = Deno.env.get('DROPBOX_CLIENT_SECRET')

      const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri
        })
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        console.error('Dropbox token exchange failed:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to exchange Dropbox code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      tokens = await tokenResponse.json()
      accountEmail = tokens.account_id // Dropbox returns account_id

      // Get account info
      const accountResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      })

      if (accountResponse.ok) {
        const account = await accountResponse.json()
        accountEmail = account.email
      }

      // Create RetroPlay folder
      const folderResponse = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: '/RetroPlay ROMs',
          autorename: false
        })
      })

      let appFolderPath = '/RetroPlay ROMs'
      // Folder might already exist, that's okay

      // Store connection
      const { error } = await supabase
        .from('external_storage_connections')
        .upsert({
          user_id: user.id,
          provider: 'dropbox',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null,
          account_email: accountEmail,
          app_folder_path: appFolderPath,
          connected_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' })

      if (error) {
        console.error('Failed to store connection:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to store connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        provider,
        accountEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('OAuth callback error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
