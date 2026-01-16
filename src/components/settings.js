import { themes, layouts, loadSettings, saveSettings, applyTheme, applyLayout } from '../lib/themes.js'

let currentSettings = loadSettings()

// Render settings modal
export function renderSettingsModal() {
  closeSettingsModal()

  const modal = document.createElement('div')
  modal.id = 'settings-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal modal-large">
      <button class="modal-close" id="settings-close">&times;</button>
      <div class="settings-container">
        <div class="settings-sidebar">
          <h2>Settings</h2>
          <nav class="settings-nav">
            <button class="settings-nav-btn active" data-section="appearance">
              <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 14 4 4 0 0 1 0 8 10 10 0 1 0 0-20z" fill="currentColor" opacity="0.3"/></svg>
              Appearance
            </button>
            <button class="settings-nav-btn" data-section="emulation">
              <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M15 10h2m-1-1v2m3 1h2m-1-1v2"/></svg>
              Emulation
            </button>
            <button class="settings-nav-btn" data-section="audio">
              <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07m2.83-9.9a9 9 0 0 1 0 12.73"/></svg>
              Audio
            </button>
            <button class="settings-nav-btn" data-section="controls">
              <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h4M6 12h4m4 0h.01m3.99 0h.01M6 16h.01M10 16h8"/></svg>
              Controls
            </button>
            <button class="settings-nav-btn" data-section="data">
              <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8m10-18v4H7V3"/></svg>
              Data
            </button>
          </nav>
        </div>
        <div class="settings-content">
          <!-- Appearance Section -->
          <section id="section-appearance" class="settings-section active">
            <h3>Appearance</h3>

            <div class="setting-group">
              <label class="setting-label">Layout Style</label>
              <p class="setting-description">Choose a console-inspired interface layout</p>
              <div class="layout-grid" id="layout-grid">
                ${Object.values(layouts).map(layout => `
                  <button class="layout-option ${currentSettings.layout === layout.id ? 'selected' : ''}"
                          data-layout="${layout.id}">
                    <span class="layout-icon">${layout.icon}</span>
                    <span class="layout-name">${layout.name}</span>
                    <span class="layout-desc">${layout.description}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="setting-group">
              <label class="setting-label">XMB Navigation Mode</label>
              <div class="setting-row">
                <div class="setting-info">
                  <span>PS3 XMB Mode</span>
                  <span class="setting-hint">PlayStation 3-style horizontal navigation with wave background</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="setting-xmb-mode" ${currentSettings.xmbMode ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-group">
              <label class="setting-label">Theme</label>
              <p class="setting-description">Choose your preferred color theme</p>
              <div class="theme-grid" id="theme-grid">
                ${Object.values(themes).map(theme => `
                  <button class="theme-option ${currentSettings.theme === theme.id ? 'selected' : ''}"
                          data-theme="${theme.id}"
                          style="--preview-bg: ${theme.colors['--bg-primary']}; --preview-accent: ${theme.colors['--accent-primary']}">
                    <span class="theme-swatch" style="background: ${theme.colors['--accent-primary']}"></span>
                    <span class="theme-name">${theme.name}</span>
                    <span class="theme-preview"></span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="setting-group">
              <label class="setting-label">Display Effects</label>
              <div class="setting-row">
                <div class="setting-info">
                  <span>Scanlines</span>
                  <span class="setting-hint">Add retro CRT effect</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="setting-scanlines" ${currentSettings.scanlines ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <div class="setting-info">
                  <span>Smoothing</span>
                  <span class="setting-hint">Smooth pixel edges</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="setting-smoothing" ${currentSettings.smoothing ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <div class="setting-info">
                  <span>Show FPS</span>
                  <span class="setting-hint">Display frames per second</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="setting-fps" ${currentSettings.showFPS ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          <!-- Emulation Section -->
          <section id="section-emulation" class="settings-section">
            <h3>Emulation</h3>

            <div class="setting-group">
              <label class="setting-label">Auto Save</label>
              <div class="setting-row">
                <div class="setting-info">
                  <span>Enable Auto Save</span>
                  <span class="setting-hint">Automatically save progress</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="setting-autosave" ${currentSettings.autoSave ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <div class="setting-info">
                  <span>Auto Save Interval</span>
                  <span class="setting-hint">How often to auto save</span>
                </div>
                <select id="setting-autosave-interval" class="setting-select">
                  <option value="30" ${currentSettings.autoSaveInterval === 30 ? 'selected' : ''}>30 seconds</option>
                  <option value="60" ${currentSettings.autoSaveInterval === 60 ? 'selected' : ''}>1 minute</option>
                  <option value="120" ${currentSettings.autoSaveInterval === 120 ? 'selected' : ''}>2 minutes</option>
                  <option value="300" ${currentSettings.autoSaveInterval === 300 ? 'selected' : ''}>5 minutes</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Audio Section -->
          <section id="section-audio" class="settings-section">
            <h3>Audio</h3>

            <div class="setting-group">
              <div class="setting-row">
                <div class="setting-info">
                  <span>Enable Audio</span>
                  <span class="setting-hint">Game sound effects and music</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="setting-audio" ${currentSettings.audioEnabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="setting-row">
                <div class="setting-info">
                  <span>Volume</span>
                  <span class="setting-hint">${currentSettings.audioVolume}%</span>
                </div>
                <input type="range" id="setting-volume" class="setting-range"
                       min="0" max="100" value="${currentSettings.audioVolume}">
              </div>
            </div>
          </section>

          <!-- Controls Section -->
          <section id="section-controls" class="settings-section">
            <h3>Controls</h3>

            <div class="setting-group">
              <label class="setting-label">Virtual Gamepad</label>
              <div class="setting-row">
                <div class="setting-info">
                  <span>Show Virtual Gamepad</span>
                  <span class="setting-hint">On-screen touch controls</span>
                </div>
                <select id="setting-gamepad" class="setting-select">
                  <option value="auto" ${currentSettings.virtualGamepad === 'auto' ? 'selected' : ''}>Auto (mobile only)</option>
                  <option value="always" ${currentSettings.virtualGamepad === 'always' ? 'selected' : ''}>Always</option>
                  <option value="never" ${currentSettings.virtualGamepad === 'never' ? 'selected' : ''}>Never</option>
                </select>
              </div>
              <div class="setting-row">
                <div class="setting-info">
                  <span>Gamepad Opacity</span>
                  <span class="setting-hint">${currentSettings.gamepadOpacity}%</span>
                </div>
                <input type="range" id="setting-gamepad-opacity" class="setting-range"
                       min="20" max="100" value="${currentSettings.gamepadOpacity}">
              </div>
            </div>

            <div class="setting-group">
              <label class="setting-label">Keyboard Shortcuts</label>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <span class="shortcut-action">Save State</span>
                  <kbd>F5</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-action">Load State</span>
                  <kbd>F8</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-action">Fullscreen</span>
                  <kbd>F11</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-action">Pause/Resume</span>
                  <kbd>P</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-action">Mute</span>
                  <kbd>M</kbd>
                </div>
                <div class="shortcut-item">
                  <span class="shortcut-action">Screenshot</span>
                  <kbd>F12</kbd>
                </div>
              </div>
            </div>
          </section>

          <!-- Data Section -->
          <section id="section-data" class="settings-section">
            <h3>Data Management</h3>

            <div class="setting-group">
              <label class="setting-label">Local Data</label>
              <p class="setting-description">Manage your locally stored data</p>

              <div class="data-actions">
                <button class="btn btn-outline" id="export-data">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Export Data
                </button>
                <button class="btn btn-outline" id="import-data">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Import Data
                </button>
                <input type="file" id="import-file" accept=".json" hidden>
              </div>

              <div class="data-stats" id="data-stats">
                <div class="data-stat">
                  <span class="data-stat-label">Recent Games</span>
                  <span class="data-stat-value" id="stat-games">0</span>
                </div>
                <div class="data-stat">
                  <span class="data-stat-label">Local Saves</span>
                  <span class="data-stat-value" id="stat-saves">Calculating...</span>
                </div>
              </div>
            </div>

            <div class="setting-group danger-zone">
              <label class="setting-label">Danger Zone</label>
              <p class="setting-description">These actions cannot be undone</p>
              <div class="data-actions">
                <button class="btn btn-danger" id="clear-recent">
                  Clear Recent Games
                </button>
                <button class="btn btn-danger" id="clear-all">
                  Clear All Data
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Trigger reflow and add show class for animation
  requestAnimationFrame(() => {
    modal.classList.add('show')
  })

  setupSettingsEvents()
  loadDataStats()
}

function setupSettingsEvents() {
  // Close modal
  document.getElementById('settings-close').addEventListener('click', closeSettingsModal)
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') closeSettingsModal()
  })

  // Navigation
  document.querySelectorAll('.settings-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'))
      document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'))
      btn.classList.add('active')
      document.getElementById(`section-${btn.dataset.section}`).classList.add('active')
    })
  })

  // Layout selection
  document.querySelectorAll('.layout-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layout-option').forEach(b => b.classList.remove('selected'))
      btn.classList.add('selected')
      const layoutId = btn.dataset.layout
      currentSettings.layout = layoutId
      saveSettings(currentSettings)
      applyLayout(layoutId)
    })
  })

  // Theme selection
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('selected'))
      btn.classList.add('selected')
      const themeId = btn.dataset.theme
      currentSettings.theme = themeId
      saveSettings(currentSettings)
      applyTheme(themeId)
    })
  })

  // Toggle settings
  setupToggle('setting-scanlines', 'scanlines')
  setupToggle('setting-smoothing', 'smoothing')
  setupToggle('setting-fps', 'showFPS')
  setupToggle('setting-autosave', 'autoSave')
  setupToggle('setting-audio', 'audioEnabled')

  // XMB Mode toggle with special handling
  const xmbToggle = document.getElementById('setting-xmb-mode')
  if (xmbToggle) {
    xmbToggle.addEventListener('change', (e) => {
      currentSettings.xmbMode = e.target.checked
      saveSettings(currentSettings)
      // Dispatch event for main.js to handle XMB activation
      window.dispatchEvent(new CustomEvent('xmb-mode-changed', { detail: { enabled: e.target.checked } }))
      if (e.target.checked) {
        closeSettingsModal()
      }
    })
  }

  // Select settings
  setupSelect('setting-autosave-interval', 'autoSaveInterval', true)
  setupSelect('setting-gamepad', 'virtualGamepad')

  // Range settings
  setupRange('setting-volume', 'audioVolume')
  setupRange('setting-gamepad-opacity', 'gamepadOpacity')

  // Data management
  document.getElementById('export-data').addEventListener('click', exportData)
  document.getElementById('import-data').addEventListener('click', () => {
    document.getElementById('import-file').click()
  })
  document.getElementById('import-file').addEventListener('change', importData)
  document.getElementById('clear-recent').addEventListener('click', clearRecentGames)
  document.getElementById('clear-all').addEventListener('click', clearAllData)
}

function setupToggle(id, setting) {
  document.getElementById(id).addEventListener('change', (e) => {
    currentSettings[setting] = e.target.checked
    saveSettings(currentSettings)
  })
}

function setupSelect(id, setting, isNumber = false) {
  document.getElementById(id).addEventListener('change', (e) => {
    currentSettings[setting] = isNumber ? parseInt(e.target.value) : e.target.value
    saveSettings(currentSettings)
  })
}

function setupRange(id, setting) {
  const input = document.getElementById(id)
  input.addEventListener('input', (e) => {
    currentSettings[setting] = parseInt(e.target.value)
    // Update hint text
    const hint = input.closest('.setting-row').querySelector('.setting-hint')
    if (hint) hint.textContent = `${e.target.value}%`
  })
  input.addEventListener('change', () => {
    saveSettings(currentSettings)
  })
}

async function loadDataStats() {
  // Count recent games
  try {
    const recentGames = JSON.parse(localStorage.getItem('retroplay_recent') || '[]')
    document.getElementById('stat-games').textContent = recentGames.length
  } catch {
    document.getElementById('stat-games').textContent = '0'
  }

  // Estimate IndexedDB size
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1)
      document.getElementById('stat-saves').textContent = `~${usedMB} MB`
    } else {
      document.getElementById('stat-saves').textContent = 'Unknown'
    }
  } catch {
    document.getElementById('stat-saves').textContent = 'Unknown'
  }
}

function exportData() {
  const data = {
    version: 1,
    exportDate: new Date().toISOString(),
    settings: currentSettings,
    recentGames: JSON.parse(localStorage.getItem('retroplay_recent') || '[]'),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `retroplay-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)

  showToast('Data exported successfully!', 'success')
}

function importData(e) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result)

      if (data.settings) {
        currentSettings = { ...currentSettings, ...data.settings }
        saveSettings(currentSettings)
        applyTheme(currentSettings.theme)
      }

      if (data.recentGames) {
        localStorage.setItem('retroplay_recent', JSON.stringify(data.recentGames))
      }

      showToast('Data imported successfully!', 'success')
      closeSettingsModal()
      location.reload()
    } catch (err) {
      showToast('Failed to import data', 'error')
    }
  }
  reader.readAsText(file)
}

function clearRecentGames() {
  if (confirm('Clear all recent games? This cannot be undone.')) {
    localStorage.removeItem('retroplay_recent')
    showToast('Recent games cleared', 'success')
    loadDataStats()
  }
}

function clearAllData() {
  if (confirm('Clear ALL data including saves and settings? This cannot be undone.')) {
    localStorage.clear()

    // Clear IndexedDB
    indexedDB.deleteDatabase('retroplay_games')

    showToast('All data cleared', 'success')
    location.reload()
  }
}

export function closeSettingsModal() {
  document.getElementById('settings-modal')?.remove()
}

function showToast(message, type = 'info') {
  document.querySelector('.toast')?.remove()
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

// Get current settings
export function getSettings() {
  return { ...currentSettings }
}
