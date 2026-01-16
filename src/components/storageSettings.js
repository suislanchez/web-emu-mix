// Storage Settings Component
// External storage connections (Google Drive, Dropbox)

import { store } from '../lib/store.js'
import {
  connectGoogleDrive,
  connectDropbox,
  getStorageConnections,
  disconnectStorage,
  getStorageQuota,
  isExternalStorageConfigured,
  getConfiguredProviders
} from '../lib/externalStorage.js'

/**
 * Render storage settings section (for embedding in settings/profile)
 */
export function renderStorageSettings() {
  const section = document.createElement('section')
  section.id = 'storage-settings'
  section.className = 'settings-section'
  section.innerHTML = `
    <h3>Storage Settings</h3>

    <div class="setting-group">
      <label class="setting-label">Cloud Storage Quota</label>
      <div class="quota-display" id="quota-display">
        <div class="quota-bar">
          <div class="quota-used" id="quota-used" style="width: 0%"></div>
        </div>
        <span class="quota-text" id="quota-text">Calculating...</span>
      </div>
    </div>

    <div class="setting-group">
      <label class="setting-label">External Storage</label>
      <p class="setting-description">Connect your cloud storage to save ROMs in your own account</p>

      <div class="storage-connections" id="storage-connections">
        <!-- Google Drive -->
        <div class="storage-option" data-provider="google_drive">
          <div class="storage-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="#4285F4" d="M12 11l-6 9h12l-6-9z"/>
              <path fill="#FBBC05" d="M6 20l6-9-6-9-6 9 6 9z"/>
              <path fill="#34A853" d="M12 11l6 9 6-9-6-9-6 9z"/>
            </svg>
          </div>
          <div class="storage-info">
            <span class="storage-name">Google Drive</span>
            <span class="storage-status" id="gdrive-status">Not connected</span>
          </div>
          <button class="btn btn-outline connect-btn" id="gdrive-connect" data-provider="google_drive">
            Connect
          </button>
        </div>

        <!-- Dropbox -->
        <div class="storage-option" data-provider="dropbox">
          <div class="storage-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#0061FF">
              <path d="M6 2l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4zm12 0l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4zM6 14l6 4 6-4"/>
            </svg>
          </div>
          <div class="storage-info">
            <span class="storage-name">Dropbox</span>
            <span class="storage-status" id="dropbox-status">Not connected</span>
          </div>
          <button class="btn btn-outline connect-btn" id="dropbox-connect" data-provider="dropbox">
            Connect
          </button>
        </div>
      </div>

      ${!isExternalStorageConfigured() ? `
        <p class="setting-note">External storage is not configured. Contact the administrator to enable this feature.</p>
      ` : ''}
    </div>

    <div class="setting-group">
      <label class="setting-label">Default Storage Location</label>
      <p class="setting-description">Where to save newly downloaded games</p>
      <select id="default-storage" class="setting-select">
        <option value="supabase">RetroPlay Cloud (5GB free)</option>
        <option value="google_drive" disabled>Google Drive (connect first)</option>
        <option value="dropbox" disabled>Dropbox (connect first)</option>
        <option value="local">Browser Storage (local only)</option>
      </select>
    </div>
  `

  return section
}

/**
 * Load and display storage status
 */
export async function loadStorageStatus() {
  const { user } = store.getState()
  if (!user) return

  // Load quota
  try {
    const quota = await getStorageQuota(user.id)
    if (quota) {
      const usedPercent = Math.min(100, (quota.used_bytes / quota.quota_bytes) * 100)
      const usedMB = (quota.used_bytes / (1024 * 1024)).toFixed(1)
      const totalGB = (quota.quota_bytes / (1024 * 1024 * 1024)).toFixed(1)

      const quotaUsed = document.getElementById('quota-used')
      const quotaText = document.getElementById('quota-text')

      if (quotaUsed) quotaUsed.style.width = `${usedPercent}%`
      if (quotaText) quotaText.textContent = `${usedMB} MB / ${totalGB} GB used`
    }
  } catch (err) {
    console.error('Load quota error:', err)
  }

  // Load connections
  try {
    const connections = await getStorageConnections(user.id)

    for (const conn of connections) {
      const providerId = conn.provider === 'google_drive' ? 'gdrive' : 'dropbox'
      const statusEl = document.getElementById(`${providerId}-status`)
      const connectBtn = document.getElementById(`${providerId}-connect`)
      const selectOption = document.querySelector(`#default-storage option[value="${conn.provider}"]`)

      if (statusEl) {
        statusEl.textContent = `Connected (${conn.account_email || 'Unknown account'})`
        statusEl.classList.add('connected')
      }

      if (connectBtn) {
        connectBtn.textContent = 'Disconnect'
        connectBtn.classList.add('connected')
        connectBtn.dataset.connected = 'true'
      }

      if (selectOption) {
        selectOption.disabled = false
      }
    }
  } catch (err) {
    console.error('Load connections error:', err)
  }
}

/**
 * Setup storage settings event handlers
 */
export function setupStorageEvents() {
  // Google Drive connect/disconnect
  document.getElementById('gdrive-connect')?.addEventListener('click', async (e) => {
    const btn = e.target
    if (btn.dataset.connected === 'true') {
      await handleDisconnect('google_drive')
    } else {
      connectGoogleDrive()
    }
  })

  // Dropbox connect/disconnect
  document.getElementById('dropbox-connect')?.addEventListener('click', async (e) => {
    const btn = e.target
    if (btn.dataset.connected === 'true') {
      await handleDisconnect('dropbox')
    } else {
      connectDropbox()
    }
  })

  // Default storage selection
  document.getElementById('default-storage')?.addEventListener('change', (e) => {
    localStorage.setItem('default_storage', e.target.value)
    showToast('Default storage updated', 'success')
  })

  // Load saved preference
  const savedStorage = localStorage.getItem('default_storage')
  if (savedStorage) {
    const select = document.getElementById('default-storage')
    if (select) {
      const option = select.querySelector(`option[value="${savedStorage}"]`)
      if (option && !option.disabled) {
        select.value = savedStorage
      }
    }
  }
}

async function handleDisconnect(provider) {
  const { user } = store.getState()
  if (!user) return

  const providerName = provider === 'google_drive' ? 'Google Drive' : 'Dropbox'

  if (!confirm(`Disconnect ${providerName}? Your ROMs stored there will no longer be accessible from RetroPlay.`)) {
    return
  }

  try {
    await disconnectStorage(user.id, provider)

    const providerId = provider === 'google_drive' ? 'gdrive' : 'dropbox'
    const statusEl = document.getElementById(`${providerId}-status`)
    const connectBtn = document.getElementById(`${providerId}-connect`)
    const selectOption = document.querySelector(`#default-storage option[value="${provider}"]`)

    if (statusEl) {
      statusEl.textContent = 'Not connected'
      statusEl.classList.remove('connected')
    }

    if (connectBtn) {
      connectBtn.textContent = 'Connect'
      connectBtn.classList.remove('connected')
      connectBtn.dataset.connected = 'false'
    }

    if (selectOption) {
      selectOption.disabled = true
    }

    // Reset default storage if it was this provider
    const defaultStorage = localStorage.getItem('default_storage')
    if (defaultStorage === provider) {
      localStorage.setItem('default_storage', 'supabase')
      const select = document.getElementById('default-storage')
      if (select) select.value = 'supabase'
    }

    showToast(`${providerName} disconnected`, 'success')
  } catch (err) {
    console.error('Disconnect error:', err)
    showToast('Failed to disconnect', 'error')
  }
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => toast.classList.add('show'), 10)
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

/**
 * Handle OAuth callback page
 */
export async function handleOAuthCallbackPage() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')

  if (!code || !state) {
    document.body.innerHTML = '<div style="padding: 2rem; text-align: center;">Invalid OAuth callback</div>'
    return
  }

  document.body.innerHTML = `
    <div style="padding: 2rem; text-align: center;">
      <h2>Connecting ${state === 'google_drive' ? 'Google Drive' : 'Dropbox'}...</h2>
      <p>Please wait while we complete the connection.</p>
    </div>
  `

  try {
    const { handleOAuthCallback } = await import('../lib/externalStorage.js')
    const result = await handleOAuthCallback()

    if (result.success) {
      document.body.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
          <h2>Connected!</h2>
          <p>${result.provider === 'google_drive' ? 'Google Drive' : 'Dropbox'} has been connected successfully.</p>
          <p>Redirecting...</p>
        </div>
      `

      // Redirect back to the original page
      const returnUrl = localStorage.getItem('oauth_return_url') || '/'
      localStorage.removeItem('oauth_return_url')
      setTimeout(() => {
        window.location.href = returnUrl
      }, 1500)
    } else {
      document.body.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
          <h2>Connection Failed</h2>
          <p>${result.error || 'Unknown error occurred'}</p>
          <a href="/">Return to RetroPlay</a>
        </div>
      `
    }
  } catch (err) {
    console.error('OAuth callback error:', err)
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h2>Connection Failed</h2>
        <p>${err.message}</p>
        <a href="/">Return to RetroPlay</a>
      </div>
    `
  }
}
