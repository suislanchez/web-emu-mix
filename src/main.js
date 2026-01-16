import './style.css'
import { auth, saves, sessions, achievements } from './lib/supabase.js'
import { store, loadRecentGames as loadStoredGames, updateRecentGames } from './lib/store.js'
import { loadUserData, updateHeaderUI, renderAuthModal } from './components/auth.js'
import { renderGamePanel, closeGamePanel } from './components/gamePanel.js'
import { fetchCoverArt } from './lib/coverArt.js'
import { initTheme } from './lib/themes.js'

// Initialize theme immediately
initTheme()

// System logos - primary sources
const SYSTEM_LOGOS = {
  nes: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/NES_logo.svg',
  snes: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/SNES_logo.svg',
  gb: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Game_Boy_logo.svg',
  gbc: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Game_Boy_Color_logo.svg',
  gba: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Gameboy_advance_logo.svg',
  nds: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Nintendo_DS_Logo.svg',
  n64: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo_64_Logo.svg',
  segaMD: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Sega_Genesis_Logo.svg',
  segaMS: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sega_Master_System_Logo.svg',
  segaGG: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Sega_Game_Gear_Logo.svg',
  psx: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Playstation_logo_colour.svg',
  arcade: 'https://upload.wikimedia.org/wikipedia/commons/1/13/MAME_Logo.svg',
}

// Backup logo sources
const SYSTEM_LOGOS_BACKUP = {
  nes: 'https://www.svgrepo.com/show/305509/nes.svg',
  snes: 'https://www.svgrepo.com/show/305511/snes.svg',
  gb: 'https://www.svgrepo.com/show/305503/gameboy.svg',
  gbc: 'https://www.svgrepo.com/show/305503/gameboy.svg',
  gba: 'https://www.svgrepo.com/show/305503/gameboy.svg',
  nds: 'https://www.svgrepo.com/show/305510/nintendo-3ds.svg',
  n64: 'https://www.svgrepo.com/show/305508/nintendo-64.svg',
  segaMD: 'https://www.svgrepo.com/show/305507/sega.svg',
  segaMS: 'https://www.svgrepo.com/show/305507/sega.svg',
  segaGG: 'https://www.svgrepo.com/show/305507/sega.svg',
  psx: 'https://www.svgrepo.com/show/305512/playstation.svg',
  arcade: 'https://www.svgrepo.com/show/305502/arcade.svg',
}

// SVG fallback icons (colored, no emojis)
const SYSTEM_SVG_ICONS = {
  nes: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="8" y="18" width="48" height="28" rx="3"/><rect x="14" y="26" width="12" height="8" rx="1" fill="currentColor"/><circle cx="44" cy="32" r="4"/><circle cx="52" cy="28" r="2.5"/><rect x="26" y="40" width="12" height="3" rx="1" fill="currentColor"/></svg>`,
  snes: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="20" width="52" height="24" rx="4"/><rect x="12" y="26" width="14" height="10" rx="2" fill="currentColor"/><circle cx="42" cy="32" r="3"/><circle cx="50" cy="28" r="2.5"/><circle cx="50" cy="36" r="2.5"/><circle cx="54" cy="32" r="2.5"/></svg>`,
  gb: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="16" y="6" width="32" height="52" rx="4"/><rect x="20" y="12" width="24" height="18" rx="2" fill="currentColor" fill-opacity="0.3"/><circle cx="26" cy="42" r="5"/><circle cx="40" cy="40" r="3"/><circle cx="40" cy="48" r="3"/></svg>`,
  gbc: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="14" y="6" width="36" height="52" rx="4"/><rect x="18" y="12" width="28" height="20" rx="2"/><rect x="20" y="14" width="24" height="16" rx="1" fill="currentColor" fill-opacity="0.4"/><circle cx="26" cy="44" r="5"/><circle cx="42" cy="42" r="3"/><circle cx="42" cy="50" r="3"/></svg>`,
  gba: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="18" width="56" height="28" rx="6"/><rect x="12" y="24" width="18" height="14" rx="2" fill="currentColor" fill-opacity="0.3"/><circle cx="44" cy="32" r="3"/><circle cx="52" cy="28" r="2"/><circle cx="52" cy="36" r="2"/><rect x="6" y="14" width="10" height="8" rx="2"/><rect x="48" y="14" width="10" height="8" rx="2"/></svg>`,
  nds: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="4" width="36" height="26" rx="3"/><rect x="18" y="8" width="28" height="16" rx="1" fill="currentColor" fill-opacity="0.3"/><rect x="14" y="34" width="36" height="26" rx="3"/><rect x="18" y="38" width="28" height="16" rx="1" fill="currentColor" fill-opacity="0.3"/><line x1="20" y1="31" x2="44" y2="31" stroke-width="1.5"/></svg>`,
  n64: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 28 L32 18 L54 28 L54 42 L32 52 L10 42 Z"/><circle cx="22" cy="36" r="5" fill="currentColor" fill-opacity="0.3"/><circle cx="42" cy="36" r="4" fill="currentColor"/><rect x="28" y="42" width="8" height="4" rx="1" fill="currentColor" fill-opacity="0.3"/></svg>`,
  segaMD: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="22" width="52" height="20" rx="3"/><rect x="10" y="16" width="20" height="10" rx="2"/><circle cx="44" cy="32" r="4" fill="currentColor"/><rect x="14" y="28" width="14" height="8" rx="1" fill="currentColor" fill-opacity="0.3"/></svg>`,
  segaMS: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="8" y="20" width="48" height="24" rx="4"/><rect x="14" y="26" width="18" height="10" rx="1" fill="currentColor" fill-opacity="0.3"/><rect x="14" y="38" width="14" height="3" rx="1" fill="currentColor"/><circle cx="46" cy="32" r="5"/><circle cx="46" cy="32" r="2" fill="currentColor"/></svg>`,
  segaGG: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="16" width="52" height="32" rx="6"/><rect x="18" y="22" width="28" height="20" rx="2" fill="currentColor" fill-opacity="0.3"/><circle cx="12" cy="32" r="3" fill="currentColor"/><circle cx="52" cy="32" r="3" fill="currentColor"/></svg>`,
  psx: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="8" y="22" width="48" height="20" rx="4"/><circle cx="22" cy="32" r="5"/><circle cx="22" cy="32" r="2" fill="currentColor"/><rect x="36" y="27" width="4" height="4" rx="1" fill="currentColor"/><rect x="42" y="27" width="4" height="4" rx="1" fill="currentColor"/><rect x="36" y="33" width="4" height="4" rx="1" fill="currentColor"/><rect x="42" y="33" width="4" height="4" rx="1" fill="currentColor"/></svg>`,
  arcade: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="14" y="6" width="36" height="52" rx="4"/><rect x="18" y="10" width="28" height="18" rx="2" fill="currentColor" fill-opacity="0.3"/><circle cx="28" cy="40" r="6"/><circle cx="28" cy="40" r="2" fill="currentColor"/><circle cx="44" cy="36" r="3" fill="currentColor"/><circle cx="44" cy="44" r="3" fill="currentColor"/><circle cx="50" cy="40" r="3" fill="currentColor"/></svg>`,
}

// System colors
const SYSTEM_COLORS = {
  nes: '#e60012', snes: '#7b5aa6', gb: '#8b956d', gbc: '#4ecdc4', gba: '#5a5eb9', nds: '#b4b4b4',
  n64: '#339947', segaMD: '#17569b', segaMS: '#d32f2f', segaGG: '#1976d2', psx: '#003087', arcade: '#ff9800',
}

// Supported systems
const SYSTEMS = [
  { id: 'nes', name: 'Nintendo', abbr: 'NES', core: 'fceumm', extensions: ['.nes'] },
  { id: 'snes', name: 'Super Nintendo', abbr: 'SNES', core: 'snes9x', extensions: ['.sfc', '.smc'] },
  { id: 'gb', name: 'Game Boy', abbr: 'GB', core: 'gambatte', extensions: ['.gb'] },
  { id: 'gbc', name: 'Game Boy Color', abbr: 'GBC', core: 'gambatte', extensions: ['.gbc'] },
  { id: 'gba', name: 'Game Boy Advance', abbr: 'GBA', core: 'mgba', extensions: ['.gba'] },
  { id: 'nds', name: 'Nintendo DS', abbr: 'NDS', core: 'melonds', extensions: ['.nds'] },
  { id: 'n64', name: 'Nintendo 64', abbr: 'N64', core: 'mupen64plus_next', extensions: ['.n64', '.z64', '.v64'] },
  { id: 'segaMD', name: 'Sega Genesis', abbr: 'Genesis', core: 'genesis_plus_gx', extensions: ['.md', '.gen', '.bin'] },
  { id: 'segaMS', name: 'Master System', abbr: 'SMS', core: 'genesis_plus_gx', extensions: ['.sms'] },
  { id: 'segaGG', name: 'Game Gear', abbr: 'GG', core: 'genesis_plus_gx', extensions: ['.gg'] },
  { id: 'psx', name: 'PlayStation', abbr: 'PS1', core: 'pcsx_rearmed', extensions: ['.bin', '.iso', '.cue'] },
  { id: 'arcade', name: 'Arcade', abbr: 'MAME', core: 'fbneo', extensions: ['.zip'] },
]

// App state
let selectedSystem = null
let recentGames = []
let currentGame = null
let currentSession = null
let sessionStartTime = null

// DOM Elements
const systemGrid = document.getElementById('system-grid')
const uploadArea = document.getElementById('upload-area')
const romInput = document.getElementById('rom-input')
const supportedFormats = document.getElementById('supported-formats')
const recentGamesSection = document.getElementById('recent-games-section')
const gamesGrid = document.getElementById('games-grid')
const libraryView = document.getElementById('library-view')
const emulatorView = document.getElementById('emulator-view')
const gameTitle = document.getElementById('game-title')
const backBtn = document.getElementById('back-btn')
const saveStateBtn = document.getElementById('save-state-btn')
const loadStateBtn = document.getElementById('load-state-btn')
const cloudSaveBtn = document.getElementById('cloud-save-btn')
const infoPanelBtn = document.getElementById('info-panel-btn')
const fullscreenBtn = document.getElementById('fullscreen-btn')

// Initialize app
async function init() {
  loadStoredGames()
  recentGames = store.getState().recentGames || []

  renderSystems()
  renderRecentGames()
  setupEventListeners()

  // Initialize auth
  try {
    await loadUserData()
  } catch (e) {
    console.log('Running in offline mode')
  }
  updateHeaderUI()

  // Listen for auth changes
  try {
    auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await loadUserData()
        updateHeaderUI()
      } else if (event === 'SIGNED_OUT') {
        store.setState({ user: null, profile: null })
        updateHeaderUI()
      }
    })
  } catch (e) {
    console.log('Auth listener not available')
  }
}

// Handle image load errors with fallback chain
function handleLogoError(img, systemId) {
  const backup = SYSTEM_LOGOS_BACKUP[systemId]
  const svgFallback = SYSTEM_SVG_ICONS[systemId]
  const color = SYSTEM_COLORS[systemId]

  // If we haven't tried backup yet, try it
  if (img.src !== backup && backup) {
    img.src = backup
  } else {
    // All image sources failed, use SVG fallback
    const container = img.parentElement
    container.innerHTML = `<div class="svg-icon" style="color: ${color}">${svgFallback}</div>`
  }
}

// Render system cards
function renderSystems() {
  systemGrid.innerHTML = SYSTEMS.map(system => `
    <div class="system-card" data-system="${system.id}" style="--system-color: ${SYSTEM_COLORS[system.id]}">
      <div class="system-logo">
        <img
          src="${SYSTEM_LOGOS[system.id]}"
          alt="${system.name}"
          loading="lazy"
          onerror="handleLogoError(this, '${system.id}')"
        />
      </div>
      <div class="system-info">
        <div class="system-name">${system.name}</div>
        <div class="system-abbr">${system.abbr}</div>
      </div>
    </div>
  `).join('')
}

// Make handleLogoError available globally for inline onerror
window.handleLogoError = handleLogoError

// Setup event listeners
function setupEventListeners() {
  systemGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.system-card')
    if (card) selectSystem(card.dataset.system)
  })

  uploadArea.addEventListener('click', () => {
    if (selectedSystem) romInput.click()
    else showToast('Please select a system first', 'error')
  })

  romInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0])
  })

  uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over') })
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'))
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault()
    uploadArea.classList.remove('drag-over')
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0])
  })

  backBtn.addEventListener('click', () => { endSession(); stopEmulator(); showLibrary() })

  saveStateBtn.addEventListener('click', () => {
    if (window.EJS_emulator) {
      window.EJS_emulator.gameManager.saveSaveFiles()
      showToast('State saved!', 'success')
    }
  })

  loadStateBtn.addEventListener('click', () => {
    if (window.EJS_emulator) {
      window.EJS_emulator.gameManager.loadSaveFiles()
      showToast('State loaded!', 'success')
    }
  })

  // Cloud save button
  if (cloudSaveBtn) {
    cloudSaveBtn.addEventListener('click', async () => {
      const { user } = store.getState()
      if (!user) {
        showToast('Sign in to use cloud saves', 'error')
        renderAuthModal('login')
        return
      }
      if (!currentGame || !window.EJS_emulator) {
        showToast('No game running', 'error')
        return
      }
      try {
        showLoading('Saving to cloud...')
        const saveData = window.EJS_emulator.gameManager.getSaveFile()
        if (saveData) {
          const blob = new Blob([saveData], { type: 'application/octet-stream' })
          await saves.save(user.id, currentGame.gameId, blob)
          showToast('Saved to cloud!', 'success')
        } else {
          showToast('No save data available', 'error')
        }
      } catch (error) {
        console.error('Cloud save error:', error)
        showToast('Failed to save to cloud', 'error')
      } finally {
        hideLoading()
      }
    })
  }

  // Info panel button
  if (infoPanelBtn) {
    infoPanelBtn.addEventListener('click', () => {
      if (currentGame) renderGamePanel(currentGame.gameId, currentGame.name, currentGame.systemId)
    })
  }

  fullscreenBtn.addEventListener('click', () => {
    const container = document.getElementById('emulator-container')
    if (container.requestFullscreen) container.requestFullscreen()
    else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen()
  })

  gamesGrid.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.play-btn')
    const deleteBtn = e.target.closest('.delete-btn')
    const card = e.target.closest('.game-card')
    if (deleteBtn && card) { e.stopPropagation(); deleteGame(parseInt(card.dataset.index)) }
    else if ((playBtn || card) && card) playRecentGame(parseInt(card.dataset.index))
  })
}

function selectSystem(systemId) {
  selectedSystem = SYSTEMS.find(s => s.id === systemId)
  document.querySelectorAll('.system-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.system === systemId)
  })
  if (selectedSystem) {
    supportedFormats.textContent = `Supported: ${selectedSystem.extensions.join(', ')}`
    romInput.accept = selectedSystem.extensions.join(',')
  }
}

function handleFile(file) {
  if (!selectedSystem) {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    const detectedSystem = SYSTEMS.find(s => s.extensions.includes(ext))
    if (detectedSystem) selectSystem(detectedSystem.id)
    else { showToast('Could not detect system. Please select one.', 'error'); return }
  }

  const ext = '.' + file.name.split('.').pop().toLowerCase()
  if (!selectedSystem.extensions.includes(ext)) {
    showToast(`Invalid file type. Expected: ${selectedSystem.extensions.join(', ')}`, 'error')
    return
  }

  const gameId = file.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const gameName = file.name.replace(/\.[^/.]+$/, '')
  const blobUrl = URL.createObjectURL(file)

  const gameInfo = {
    gameId, name: gameName, fileName: file.name,
    systemId: selectedSystem.id, systemName: selectedSystem.name,
    icon: SYSTEM_ICONS[selectedSystem.id], timestamp: Date.now(),
  }

  saveGameToRecent(gameInfo, file)
  launchEmulator(blobUrl, gameInfo)
}

async function launchEmulator(romUrl, gameInfo) {
  showLoading('Loading emulator...')
  currentGame = gameInfo

  // Start session if logged in
  const { user } = store.getState()
  if (user) {
    try {
      const session = await sessions.start(user.id, gameInfo.gameId, gameInfo.name, gameInfo.systemId)
      currentSession = session
      sessionStartTime = Date.now()
    } catch (e) { console.log('Session tracking unavailable') }
  }

  libraryView.style.display = 'none'
  emulatorView.style.display = 'flex'
  closeGamePanel()
  gameTitle.textContent = gameInfo.name

  const gameDiv = document.getElementById('game')
  gameDiv.innerHTML = ''

  window.EJS_player = '#game'
  window.EJS_core = selectedSystem.core
  window.EJS_gameUrl = romUrl
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/'
  window.EJS_startOnLoaded = true
  window.EJS_DEBUG_XX = false
  window.EJS_color = '#e94560'
  window.EJS_VirtualGamepadSettings = { enabled: isMobile(), opacity: 0.5, scale: 1 }

  const script = document.createElement('script')
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js'
  script.onload = () => hideLoading()
  script.onerror = () => { hideLoading(); showToast('Failed to load emulator', 'error'); showLibrary() }
  document.body.appendChild(script)
}

async function endSession() {
  if (!currentSession || !sessionStartTime) return
  const { user } = store.getState()
  if (!user) return

  const playtimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000)
  try {
    await sessions.end(currentSession.id, playtimeSeconds)
    const stats = await sessions.getStats(user.id)
    const newAchievements = await achievements.checkAndUnlock(user.id, stats)
    newAchievements.forEach(ua => showToast(`Achievement: ${ua.achievements.name}!`, 'success'))
  } catch (e) { console.log('Session end error:', e) }
  currentSession = null
  sessionStartTime = null
}

function stopEmulator() {
  if (window.EJS_emulator) try { window.EJS_emulator.pause() } catch (e) {}
  document.getElementById('game').innerHTML = ''
  document.querySelectorAll('script[src*="emulatorjs"]').forEach(el => el.remove())
  document.querySelectorAll('link[href*="emulatorjs"]').forEach(el => el.remove())
  delete window.EJS_player; delete window.EJS_core; delete window.EJS_gameUrl; delete window.EJS_emulator
  currentGame = null
}

function showLibrary() {
  emulatorView.style.display = 'none'
  libraryView.style.display = 'block'
  closeGamePanel()
  renderRecentGames()
}

async function saveGameToRecent(gameInfo, file) {
  storeGameFile(gameInfo.fileName, file)
  recentGames = recentGames.filter(g => g.fileName !== gameInfo.fileName)
  recentGames.unshift(gameInfo)
  recentGames = recentGames.slice(0, 20)
  updateRecentGames(recentGames)

  // Fetch cover art in the background
  fetchCoverArt(gameInfo.name, gameInfo.systemId).then(coverUrl => {
    if (coverUrl) {
      const game = recentGames.find(g => g.gameId === gameInfo.gameId)
      if (game) {
        game.coverUrl = coverUrl
        updateRecentGames(recentGames)
        renderRecentGames()
      }
    }
  }).catch(() => {})
}

function renderRecentGames() {
  recentGames = store.getState().recentGames || []
  if (recentGames.length === 0) { recentGamesSection.style.display = 'none'; return }

  recentGamesSection.style.display = 'block'
  gamesGrid.innerHTML = recentGames.map((game, index) => `
    <div class="game-card ${game.coverUrl ? 'has-cover' : ''}" data-index="${index}" style="--system-color: ${SYSTEM_COLORS[game.systemId] || '#666'}">
      ${game.coverUrl ? `
        <div class="game-card-cover">
          <img
            src="${game.coverUrl}"
            alt="${game.name}"
            loading="lazy"
            onerror="this.parentElement.parentElement.classList.remove('has-cover'); this.parentElement.remove();"
          />
          <div class="cover-gradient"></div>
        </div>
      ` : `
        <div class="game-card-header">
          <div class="game-card-logo">
            <img
              src="${SYSTEM_LOGOS[game.systemId]}"
              alt="${game.systemName}"
              loading="lazy"
              onerror="handleLogoError(this, '${game.systemId}')"
            />
          </div>
        </div>
      `}
      <div class="game-card-info">
        <span class="system-badge">${game.systemName}</span>
        <div class="game-card-title">${game.name}</div>
      </div>
      <div class="game-card-actions">
        <button class="play-btn">▶ Play</button>
        <button class="delete-btn">Remove</button>
      </div>
    </div>
  `).join('')

  // Fetch missing cover art for games without it
  recentGames.forEach((game, index) => {
    if (!game.coverUrl) {
      fetchCoverArt(game.name, game.systemId).then(coverUrl => {
        if (coverUrl) {
          game.coverUrl = coverUrl
          updateRecentGames(recentGames)
          // Update just this card instead of re-rendering all
          const card = gamesGrid.querySelector(`[data-index="${index}"]`)
          if (card && !card.classList.contains('has-cover')) {
            card.classList.add('has-cover')
            const header = card.querySelector('.game-card-header')
            if (header) {
              const coverDiv = document.createElement('div')
              coverDiv.className = 'game-card-cover'
              coverDiv.innerHTML = `
                <img src="${coverUrl}" alt="${game.name}" loading="lazy"
                  onerror="this.parentElement.parentElement.classList.remove('has-cover'); this.parentElement.remove();" />
                <div class="cover-gradient"></div>
              `
              header.replaceWith(coverDiv)
            }
          }
        }
      }).catch(() => {})
    }
  })
}

async function playRecentGame(index) {
  const game = recentGames[index]
  if (!game) return
  selectSystem(game.systemId)
  const file = await getGameFile(game.fileName)
  if (file) {
    game.timestamp = Date.now()
    updateRecentGames(recentGames)
    launchEmulator(URL.createObjectURL(file), game)
  } else {
    showToast('Game file not found. Please upload again.', 'error')
    deleteGame(index)
  }
}

function deleteGame(index) {
  const game = recentGames[index]
  if (game) deleteGameFile(game.fileName)
  recentGames.splice(index, 1)
  updateRecentGames(recentGames)
  renderRecentGames()
  showToast('Game removed', 'success')
}

// IndexedDB helpers
const DB_NAME = 'retroplay_games', STORE_NAME = 'files'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'name' })
    }
  })
}

async function storeGameFile(name, file) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ name, data: await file.arrayBuffer(), type: file.type })
    return new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error) })
  } catch (e) { console.error('Failed to store game file:', e) }
}

async function getGameFile(name) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORE_NAME).get(name)
      request.onsuccess = () => resolve(request.result ? new File([request.result.data], name, { type: request.result.type }) : null)
      request.onerror = () => reject(request.error)
    })
  } catch (e) { console.error('Failed to get game file:', e); return null }
}

async function deleteGameFile(name) {
  try { const db = await openDB(); db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(name) }
  catch (e) { console.error('Failed to delete game file:', e) }
}

// UI Helpers
function showLoading(text = 'Loading...') {
  document.querySelector('.loading-overlay')?.remove()
  const overlay = document.createElement('div')
  overlay.className = 'loading-overlay'
  overlay.innerHTML = `<div class="loading-spinner"></div><div class="loading-text">${text}</div>`
  document.body.appendChild(overlay)
}

function hideLoading() { document.querySelector('.loading-overlay')?.remove() }

function showToast(message, type = 'info') {
  document.querySelector('.toast')?.remove()
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

function isMobile() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) }

// Initialize
init()
