// Myrient Proxy Edge Function
// Proxies downloads from Myrient to bypass CORS and stream to Supabase Storage

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

const MYRIENT_BASE = 'https://myrient.erista.me/files/'
const MAX_FILE_SIZE = 512 * 1024 * 1024 // 512MB

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
    const { myrientPath, catalogId } = body

    if (!myrientPath || !catalogId) {
      return new Response(
        JSON.stringify({ error: 'Missing myrientPath or catalogId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user's storage quota
    const { data: quota } = await supabase
      .from('user_storage_quotas')
      .select('quota_bytes, used_bytes')
      .eq('user_id', user.id)
      .single()

    const quotaLimit = quota?.quota_bytes || 5368709120 // 5GB default
    const usedBytes = quota?.used_bytes || 0

    // Update library entry to "downloading" status
    await supabase
      .from('user_library')
      .upsert({
        user_id: user.id,
        catalog_id: catalogId,
        storage_type: 'supabase',
        download_status: 'downloading',
        download_progress: 0,
        added_at: new Date().toISOString()
      }, { onConflict: 'user_id,catalog_id,storage_type' })

    // Fetch from Myrient
    const myrientUrl = MYRIENT_BASE + myrientPath
    console.log(`Downloading: ${myrientUrl}`)

    const myrientResponse = await fetch(myrientUrl)

    if (!myrientResponse.ok) {
      await supabase
        .from('user_library')
        .update({ download_status: 'failed' })
        .eq('user_id', user.id)
        .eq('catalog_id', catalogId)

      return new Response(
        JSON.stringify({ error: 'File not found on Myrient' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contentLength = parseInt(myrientResponse.headers.get('content-length') || '0')

    // Check file size
    if (contentLength > MAX_FILE_SIZE) {
      await supabase
        .from('user_library')
        .update({ download_status: 'failed' })
        .eq('user_id', user.id)
        .eq('catalog_id', catalogId)

      return new Response(
        JSON.stringify({ error: 'File exceeds maximum size of 512MB' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check quota
    if (usedBytes + contentLength > quotaLimit) {
      await supabase
        .from('user_library')
        .update({ download_status: 'failed' })
        .eq('user_id', user.id)
        .eq('catalog_id', catalogId)

      return new Response(
        JSON.stringify({
          error: 'Storage quota exceeded',
          quota: quotaLimit,
          used: usedBytes,
          needed: contentLength
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get file content
    const fileBuffer = await myrientResponse.arrayBuffer()
    const filename = myrientPath.split('/').pop() || 'game.zip'
    const storagePath = `${user.id}/${catalogId}/${filename}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user_roms')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      await supabase
        .from('user_library')
        .update({ download_status: 'failed' })
        .eq('user_id', user.id)
        .eq('catalog_id', catalogId)

      return new Response(
        JSON.stringify({ error: 'Failed to upload to storage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update library entry
    await supabase
      .from('user_library')
      .update({
        storage_path: storagePath,
        file_size: contentLength,
        download_status: 'completed',
        download_progress: 100
      })
      .eq('user_id', user.id)
      .eq('catalog_id', catalogId)
      .eq('storage_type', 'supabase')

    // Update user's storage quota
    await supabase.rpc('update_user_storage_quota', { user_id_param: user.id })

    return new Response(
      JSON.stringify({
        success: true,
        storagePath,
        fileSize: contentLength
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Proxy error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
