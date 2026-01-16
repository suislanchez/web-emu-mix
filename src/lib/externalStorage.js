// External Storage Integration
// Google Drive and Dropbox OAuth and file operations

import { supabase } from './supabase.js'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const DROPBOX_CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID || ''

/**
 * Initiate Google Drive OAuth flow
 */
export function connectGoogleDrive() {
  if (!GOOGLE_CLIENT_ID) {
    console.error('Google Client ID not configured')
    return
  }

  const redirectUri = `${window.location.origin}/oauth/callback`
  const scope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email'

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('state', 'google_drive')
  authUrl.searchParams.set('prompt', 'consent')

  // Store current page to return to after OAuth
  localStorage.setItem('oauth_return_url', window.location.href)

  window.location.href = authUrl.toString()
}

/**
 * Initiate Dropbox OAuth flow
 */
export function connectDropbox() {
  if (!DROPBOX_CLIENT_ID) {
    console.error('Dropbox Client ID not configured')
    return
  }

  const redirectUri = `${window.location.origin}/oauth/callback`

  const authUrl = new URL('https://www.dropbox.com/oauth2/authorize')
  authUrl.searchParams.set('client_id', DROPBOX_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('token_access_type', 'offline')
  authUrl.searchParams.set('state', 'dropbox')

  // Store current page to return to after OAuth
  localStorage.setItem('oauth_return_url', window.location.href)

  window.location.href = authUrl.toString()
}

/**
 * Handle OAuth callback (call this from the callback page)
 */
export async function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state') // 'google_drive' or 'dropbox'
  const error = params.get('error')

  if (error) {
    console.error('OAuth error:', error)
    return { success: false, error }
  }

  if (!code || !state) {
    return { success: false, error: 'Missing code or state' }
  }

  if (!supabase) {
    return { success: false, error: 'Offline mode' }
  }

  const redirectUri = `${window.location.origin}/oauth/callback`

  try {
    const { data, error: fnError } = await supabase.functions.invoke('oauth-callback', {
      body: { code, provider: state, redirectUri }
    })

    if (fnError) {
      console.error('OAuth callback error:', fnError)
      return { success: false, error: fnError.message }
    }

    return { success: true, provider: state, accountEmail: data.accountEmail }
  } catch (err) {
    console.error('OAuth callback failed:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get user's storage connections
 */
export async function getStorageConnections(userId) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('external_storage_connections')
    .select('provider, account_email, storage_quota_bytes, storage_used_bytes, connected_at')
    .eq('user_id', userId)

  if (error) {
    console.error('Get connections error:', error)
    return []
  }

  return data || []
}

/**
 * Disconnect external storage
 */
export async function disconnectStorage(userId, provider) {
  if (!supabase) throw new Error('Offline mode')

  const { error } = await supabase
    .from('external_storage_connections')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)

  if (error) throw error
}

/**
 * Upload a ROM to external storage via Edge Function
 */
export async function uploadToExternalStorage(provider, myrientPath, catalogId) {
  if (!supabase) throw new Error('Offline mode')

  const { data, error } = await supabase.functions.invoke('external-storage', {
    body: {
      action: 'upload',
      provider,
      myrientPath,
      catalogId
    }
  })

  if (error) throw error
  return data
}

/**
 * Download a ROM from external storage
 */
export async function downloadFromExternalStorage(provider, fileId) {
  if (!supabase) throw new Error('Offline mode')

  const { data, error } = await supabase.functions.invoke('external-storage', {
    body: {
      action: 'download',
      provider,
      fileId
    }
  })

  if (error) throw error

  // Convert base64 back to blob
  const binaryString = atob(data.content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return new Blob([bytes], { type: 'application/octet-stream' })
}

/**
 * Delete a ROM from external storage
 */
export async function deleteFromExternalStorage(provider, fileId) {
  if (!supabase) throw new Error('Offline mode')

  const { error } = await supabase.functions.invoke('external-storage', {
    body: {
      action: 'delete',
      provider,
      fileId
    }
  })

  if (error) throw error
}

/**
 * Get user's storage quota (Supabase storage)
 */
export async function getStorageQuota(userId) {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('user_storage_quotas')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Get quota error:', error)
  }

  return data
}

/**
 * Check if external storage is configured
 */
export function isExternalStorageConfigured() {
  return !!(GOOGLE_CLIENT_ID || DROPBOX_CLIENT_ID)
}

/**
 * Get configured providers
 */
export function getConfiguredProviders() {
  const providers = []
  if (GOOGLE_CLIENT_ID) providers.push('google_drive')
  if (DROPBOX_CLIENT_ID) providers.push('dropbox')
  return providers
}
