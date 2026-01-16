// Library Manager Component
// View and manage user's game library

import { store } from '../lib/store.js'
import { library, supabase } from '../lib/supabase.js'
import { getStorageConnections, getStorageQuota, uploadToExternalStorage } from '../lib/externalStorage.js'
import { SYSTEM_INFO } from '../lib/gameCatalog.js'

let currentTab = 'all'

export async function renderLibraryManager() {
  const { user } = store.getState()
  if (!user) {
    showToast('Please sign in to view your library', 'error')
    return
  }

  const mainContent = document.querySelector('.main-content') || document.getElementById('app')
  if (!mainContent) return

  // Hide other views
  document.querySelectorAll('.library-view, .emulator-view, .system-selector, .upload-area, .recent-games, #game-browser').forEach(el => {
    if (el) el.style.display = 'none'
  })

  // Check if library manager already exists
  let manager = document.getElementById('library-manager')
  if (!manager) {
    manager = document.createElement('div')
    manager.id = 'library-manager'
    manager.className = 'library-manager'
    mainContent.appendChild(manager)
  }

  manager.style.display = 'block'
  manager.innerHTML = `
    <div class="library-header">
      <button class="btn btn-outline back-btn" id="library-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      <h1>My Library</h1>
      <div class="library-header-actions">
        <button class="btn btn-primary" id="browse-more-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          Browse Games
        </button>
      </div>
    </div>

    <div class="library-stats" id="library-stats">
      <div class="stat-card">
        <span class="stat-value" id="stat-total">-</span>
        <span class="stat-label">Total Games</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" id="stat-ready">-</span>
        <span class="stat-label">Ready to Play</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" id="stat-storage">-</span>
        <span class="stat-label">Storage Used</span>
      </div>
    </div>

    <div class="library-tabs">
      <button class="tab-btn ${currentTab === 'all' ? 'active' : ''}" data-tab="all">All Games</button>
      <button class="tab-btn ${currentTab === 'ready' ? 'active' : ''}" data-tab="ready">Ready to Play</button>
      <button class="tab-btn ${currentTab === 'cloud' ? 'active' : ''}" data-tab="cloud">Cloud Storage</button>
      <button class="tab-btn ${currentTab === 'external' ? 'active' : ''}" data-tab="external">External</button>
    </div>

    <div class="library-grid" id="library-grid">
      <div class="loading-text">Loading your library...</div>
    </div>
  `

  setupLibraryEvents()
  loadLibraryStats()
  loadLibrary()
}

function setupLibraryEvents() {
  // Back button
  document.getElementById('library-back')?.addEventListener('click', closeLibraryManager)

  // Browse more
  document.getElementById('browse-more-btn')?.addEventListener('click', () => {
    import('./gameBrowser.js').then(m => m.renderGameBrowser())
  })

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      currentTab = tab.dataset.tab
      loadLibrary()
    })
  })

  // Library grid actions
  document.getElementById('library-grid')?.addEventListener('click', handleLibraryAction)
}

async function loadLibraryStats() {
  const { user } = store.getState()
  if (!user) return

  try {
    // Get library items
    const items = await library.list(user.id)

    const totalGames = items.length
    const readyGames = items.filter(i => i.download_status === 'completed' || i.storage_type === 'external').length

    document.getElementById('stat-total').textContent = totalGames
    document.getElementById('stat-ready').textContent = readyGames

    // Get storage quota
    const quota = await getStorageQuota(user.id)
    if (quota) {
      const usedMB = (quota.used_bytes / (1024 * 1024)).toFixed(1)
      const totalGB = (quota.quota_bytes / (1024 * 1024 * 1024)).toFixed(1)
      document.getElementById('stat-storage').textContent = `${usedMB} MB / ${totalGB} GB`
    } else {
      document.getElementById('stat-storage').textContent = '0 MB'
    }
  } catch (err) {
    console.error('Load stats error:', err)
  }
}

async function loadLibrary() {
  const { user } = store.getState()
  if (!user) return

  const grid = document.getElementById('library-grid')
  if (!grid) return

  grid.innerHTML = '<div class="loading-text">Loading...</div>'

  try {
    let items = await library.list(user.id)

    // Filter by tab
    if (currentTab === 'ready') {
      items = items.filter(i => i.download_status === 'completed' || i.storage_type === 'external')
    } else if (currentTab === 'cloud') {
      items = items.filter(i => i.storage_type === 'supabase')
    } else if (currentTab === 'external') {
      items = items.filter(i => i.storage_type === 'google_drive' || i.storage_type === 'dropbox' || i.storage_type === 'external')
    }

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-library">
          <div class="empty-icon">📚</div>
          <h3>No games here yet</h3>
          <p>${currentTab === 'all' ? 'Browse the catalog to add games to your library' : 'No games in this category'}</p>
          <button class="btn btn-primary" id="empty-browse-btn">Browse Games</button>
        </div>
      `
      document.getElementById('empty-browse-btn')?.addEventListener('click', () => {
        import('./gameBrowser.js').then(m => m.renderGameBrowser())
      })
      return
    }

    grid.innerHTML = items.map(item => renderLibraryCard(item)).join('')

  } catch (err) {
    console.error('Load library error:', err)
    grid.innerHTML = '<div class="error-text">Failed to load library</div>'
  }
}

function renderLibraryCard(item) {
  const game = item.game_catalog || {}
  const systemInfo = SYSTEM_INFO[game.system_id || item.system_id] || { name: 'Unknown', color: '#666', icon: '🎮' }

  const isReady = item.download_status === 'completed' || item.storage_type === 'external'
  const isDownloading = item.download_status === 'downloading'
  const isPending = item.download_status === 'pending'

  const storageLabel = getStorageLabel(item.storage_type)
  const title = item.custom_title || game.title || item.local_filename || 'Unknown Game'

  return `
    <div class="library-card ${isReady ? 'ready' : ''}" data-library-id="${item.id}" data-catalog-id="${item.catalog_id}">
      <div class="library-cover" style="--system-color: ${systemInfo.color}">
        ${game.cover_url
          ? `<img src="${game.cover_url}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.style.display='none'">`
          : ''
        }
        <div class="library-cover-placeholder" ${game.cover_url ? 'style="display:none"' : ''}>
          <span class="system-icon">${systemInfo.icon}</span>
        </div>
        ${isDownloading ? `
          <div class="download-progress">
            <div class="download-bar">
              <div class="download-bar-fill" style="width: ${item.download_progress || 0}%"></div>
            </div>
            <span class="download-text">${item.download_progress || 0}%</span>
          </div>
        ` : ''}
      </div>
      <div class="library-info">
        <h3 class="library-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
        <div class="library-meta">
          <span class="system-badge" style="background: ${systemInfo.color}">${systemInfo.name}</span>
          <span class="storage-badge ${item.storage_type}">${storageLabel}</span>
        </div>
        ${item.last_played_at ? `
          <span class="last-played">Last played: ${formatDate(item.last_played_at)}</span>
        ` : ''}
      </div>
      <div class="library-actions">
        ${isReady
          ? `<button class="btn btn-sm btn-primary play-btn">Play</button>`
          : isDownloading
            ? `<button class="btn btn-sm btn-outline" disabled>Downloading...</button>`
            : isPending
              ? `<button class="btn btn-sm btn-primary download-btn">Download</button>`
              : `<button class="btn btn-sm btn-outline" disabled>Unavailable</button>`
        }
        <button class="btn btn-sm btn-outline remove-btn" title="Remove from library">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
          </svg>
        </button>
      </div>
    </div>
  `
}

function getStorageLabel(type) {
  switch (type) {
    case 'supabase': return 'Cloud'
    case 'local': return 'Local'
    case 'google_drive': return 'G Drive'
    case 'dropbox': return 'Dropbox'
    case 'external': return 'Link Only'
    default: return type || 'Unknown'
  }
}

async function handleLibraryAction(e) {
  const card = e.target.closest('.library-card')
  if (!card) return

  const { user } = store.getState()
  if (!user) return

  const libraryId = card.dataset.libraryId
  const catalogId = card.dataset.catalogId

  // Play
  if (e.target.closest('.play-btn')) {
    showToast('Loading game...', 'info')
    // TODO: Implement play from library
    // This would load the ROM from storage and launch the emulator
    return
  }

  // Download
  if (e.target.closest('.download-btn')) {
    const btn = e.target.closest('.download-btn')
    btn.disabled = true
    btn.textContent = 'Starting...'

    try {
      // Get the game info to get myrient path
      const item = await library.get(user.id, libraryId)
      if (item?.game_catalog?.myrient_path) {
        // Trigger download via Edge Function
        await library.startDownload(user.id, catalogId, item.game_catalog.myrient_path)
        showToast('Download started!', 'success')
        loadLibrary() // Refresh to show downloading status
      } else {
        showToast('Cannot download - missing source', 'error')
        btn.disabled = false
        btn.textContent = 'Download'
      }
    } catch (err) {
      console.error('Download error:', err)
      showToast('Download failed: ' + err.message, 'error')
      btn.disabled = false
      btn.textContent = 'Download'
    }
    return
  }

  // Remove
  if (e.target.closest('.remove-btn')) {
    if (!confirm('Remove this game from your library?')) return

    try {
      await library.remove(user.id, libraryId)
      card.remove()
      showToast('Removed from library', 'success')
      loadLibraryStats()
    } catch (err) {
      console.error('Remove error:', err)
      showToast('Failed to remove', 'error')
    }
    return
  }
}

function closeLibraryManager() {
  const manager = document.getElementById('library-manager')
  if (manager) {
    manager.style.display = 'none'
  }

  // Show original views
  document.querySelectorAll('.library-view, .system-selector, .upload-area, .recent-games').forEach(el => {
    if (el) el.style.display = ''
  })
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
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

export { closeLibraryManager }
