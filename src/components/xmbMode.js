import { store } from '../lib/store.js'
import { loadSettings } from '../lib/themes.js'
import { renderSettingsModal } from './settings.js'
import { renderAuthModal } from './auth.js'

// XMB State
let xmbActive = false
let currentCategoryIndex = 2 // Start on Games
let currentItemIndex = 0
let categoryItems = {}
let onGameSelect = null
let clockInterval = null

// Sound effects (base64 encoded small beeps)
const SOUNDS = {
  navigate: 'data:audio/wav;base64,UklGRl4AAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToAAAAYGBgYFBQQEAwMCAgICAQEBAQAAAAAAAQEBAQICAQEBAQAAAAA',
  select: 'data:audio/wav;base64,UklGRnYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVIAAAAgICAgHh4cHBoaGBgWFhQUEhIQEA4ODAwKCggIBgYEBAICAAAAAgIEBAYGCAoKDA4OEBASEhQUFhYYGBoa'
}

// Audio context for sounds
let audioCtx = null

function playSound(type) {
  const settings = loadSettings()
  if (!settings.audioEnabled) return

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }

    const audio = new Audio(SOUNDS[type])
    audio.volume = (settings.audioVolume || 80) / 100 * 0.3 // Lower volume for UI sounds
    audio.play().catch(() => {})
  } catch (e) {
    // Audio not supported
  }
}

// XMB Categories
const XMB_CATEGORIES = [
  {
    id: 'users',
    label: 'Users',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
  },
  {
    id: 'games',
    label: 'Games',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M15 10h2m-1-1v2m3 1h2m-1-1v2"/></svg>`
  },
  {
    id: 'network',
    label: 'Network',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  },
  {
    id: 'music',
    label: 'Music',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
  },
  {
    id: 'video',
    label: 'Video',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`
  }
]

// System icons for games category
const SYSTEM_ICONS = {
  nes: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="8" y="18" width="48" height="28" rx="3"/><rect x="14" y="26" width="12" height="8" rx="1" fill="currentColor"/><circle cx="44" cy="32" r="4"/></svg>`,
  snes: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="20" width="52" height="24" rx="4"/><rect x="12" y="26" width="14" height="10" rx="2" fill="currentColor"/><circle cx="42" cy="32" r="3"/></svg>`,
  gb: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="16" y="6" width="32" height="52" rx="4"/><rect x="20" y="12" width="24" height="18" rx="2" fill="currentColor" fill-opacity="0.3"/><circle cx="26" cy="42" r="5"/></svg>`,
  gbc: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="14" y="6" width="36" height="52" rx="4"/><rect x="18" y="12" width="28" height="20" rx="2"/><circle cx="26" cy="44" r="5"/></svg>`,
  gba: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="18" width="56" height="28" rx="6"/><rect x="12" y="24" width="18" height="14" rx="2" fill="currentColor" fill-opacity="0.3"/><circle cx="44" cy="32" r="3"/></svg>`,
  nds: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="4" width="36" height="26" rx="3"/><rect x="18" y="8" width="28" height="16" rx="1" fill="currentColor" fill-opacity="0.3"/><rect x="14" y="34" width="36" height="26" rx="3"/></svg>`,
  n64: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 28 L32 18 L54 28 L54 42 L32 52 L10 42 Z"/><circle cx="22" cy="36" r="5" fill="currentColor" fill-opacity="0.3"/></svg>`,
  segaMD: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="22" width="52" height="20" rx="3"/><rect x="10" y="16" width="20" height="10" rx="2"/><circle cx="44" cy="32" r="4" fill="currentColor"/></svg>`,
  segaMS: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="8" y="20" width="48" height="24" rx="4"/><rect x="14" y="26" width="18" height="10" rx="1" fill="currentColor" fill-opacity="0.3"/></svg>`,
  segaGG: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="16" width="52" height="32" rx="6"/><rect x="18" y="22" width="28" height="20" rx="2" fill="currentColor" fill-opacity="0.3"/></svg>`,
  psx: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="8" y="22" width="48" height="20" rx="4"/><circle cx="22" cy="32" r="5"/><rect x="36" y="27" width="4" height="4" rx="1" fill="currentColor"/></svg>`,
  arcade: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="14" y="6" width="36" height="52" rx="4"/><rect x="18" y="10" width="28" height="18" rx="2" fill="currentColor" fill-opacity="0.3"/><circle cx="28" cy="40" r="6"/></svg>`
}

// Build category items
function buildCategoryItems() {
  const { user, recentGames = [] } = store.getState()

  categoryItems = {
    users: user ? [
      { id: 'profile', title: user.email?.split('@')[0] || 'User', subtitle: 'Signed in', icon: 'user' },
      { id: 'signout', title: 'Sign Out', subtitle: 'Log out of your account', icon: 'signout' }
    ] : [
      { id: 'signin', title: 'Sign In', subtitle: 'Access cloud saves and stats', icon: 'signin' }
    ],

    settings: [
      { id: 'appearance', title: 'Appearance', subtitle: 'Themes, layouts, and display', icon: 'palette' },
      { id: 'emulation', title: 'Emulation', subtitle: 'Auto-save and game settings', icon: 'cpu' },
      { id: 'audio', title: 'Audio', subtitle: 'Sound and volume settings', icon: 'volume' },
      { id: 'controls', title: 'Controls', subtitle: 'Keyboard and gamepad', icon: 'gamepad' },
      { id: 'data', title: 'Data', subtitle: 'Export, import, and storage', icon: 'database' }
    ],

    games: [
      // Recent games first
      ...recentGames.slice(0, 10).map(game => ({
        id: `game-${game.gameId}`,
        title: game.name,
        subtitle: game.systemName,
        icon: 'game',
        coverUrl: game.coverUrl,
        systemId: game.systemId,
        gameData: game
      })),
      // Then systems as divider
      { id: 'divider', title: '--- Systems ---', subtitle: '', icon: 'divider', disabled: true },
      // All systems
      { id: 'system-nes', title: 'Nintendo (NES)', subtitle: 'Upload ROM', icon: 'system', systemId: 'nes' },
      { id: 'system-snes', title: 'Super Nintendo', subtitle: 'Upload ROM', icon: 'system', systemId: 'snes' },
      { id: 'system-gb', title: 'Game Boy', subtitle: 'Upload ROM', icon: 'system', systemId: 'gb' },
      { id: 'system-gbc', title: 'Game Boy Color', subtitle: 'Upload ROM', icon: 'system', systemId: 'gbc' },
      { id: 'system-gba', title: 'Game Boy Advance', subtitle: 'Upload ROM', icon: 'system', systemId: 'gba' },
      { id: 'system-nds', title: 'Nintendo DS', subtitle: 'Upload ROM', icon: 'system', systemId: 'nds' },
      { id: 'system-n64', title: 'Nintendo 64', subtitle: 'Upload ROM', icon: 'system', systemId: 'n64' },
      { id: 'system-segaMD', title: 'Sega Genesis', subtitle: 'Upload ROM', icon: 'system', systemId: 'segaMD' },
      { id: 'system-psx', title: 'PlayStation', subtitle: 'Upload ROM', icon: 'system', systemId: 'psx' },
      { id: 'system-arcade', title: 'Arcade', subtitle: 'Upload ROM', icon: 'system', systemId: 'arcade' }
    ],

    network: user ? [
      { id: 'cloud-saves', title: 'Cloud Saves', subtitle: 'Manage cloud save data', icon: 'cloud' },
      { id: 'cloud-library', title: 'My Library', subtitle: 'View your game library', icon: 'library' },
      { id: 'achievements', title: 'Achievements', subtitle: 'View your achievements', icon: 'trophy' }
    ] : [
      { id: 'signin-network', title: 'Sign In Required', subtitle: 'Sign in to access network features', icon: 'lock' }
    ],

    music: [
      { id: 'music-placeholder', title: 'No Music', subtitle: 'Music player coming soon', icon: 'music', disabled: true }
    ],

    video: [
      { id: 'video-placeholder', title: 'No Videos', subtitle: 'Video player coming soon', icon: 'video', disabled: true }
    ]
  }
}

// Get icon SVG for item
function getItemIcon(item) {
  if (item.coverUrl) {
    return `<img src="${item.coverUrl}" alt="${item.title}" onerror="this.style.display='none'">`
  }

  if (item.systemId && SYSTEM_ICONS[item.systemId]) {
    return SYSTEM_ICONS[item.systemId]
  }

  const icons = {
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    signin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`,
    signout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 14 4 4 0 0 1 0 8" fill="currentColor" opacity="0.3"/></svg>`,
    cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
    volume: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    gamepad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M15 10h2m-1-1v2"/></svg>`,
    database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    game: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/></svg>`,
    system: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
    library: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/></svg>`,
    divider: `<svg viewBox="0 0 24 24"></svg>`
  }

  return icons[item.icon] || icons.game
}

// Update clock display
function updateClock() {
  const clockTime = document.querySelector('.xmb-clock-time')
  const clockDate = document.querySelector('.xmb-clock-date')
  if (!clockTime || !clockDate) return

  const now = new Date()
  clockTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  clockDate.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

// Render XMB interface
export function renderXMB(gameSelectCallback) {
  if (xmbActive) return

  onGameSelect = gameSelectCallback
  xmbActive = true
  buildCategoryItems()

  // Reset selection
  currentCategoryIndex = 2 // Games
  currentItemIndex = 0

  const container = document.createElement('div')
  container.id = 'xmb-container'
  container.className = 'xmb-container'
  container.innerHTML = `
    <div class="xmb-background">
      <div class="xmb-wave xmb-wave-1"></div>
      <div class="xmb-wave xmb-wave-2"></div>
      <div class="xmb-wave xmb-wave-3"></div>
      <div class="xmb-gradient-overlay"></div>
    </div>

    <div class="xmb-content">
      <button class="xmb-exit-btn" id="xmb-exit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Exit XMB
      </button>

      <div class="xmb-clock">
        <div class="xmb-clock-time">00:00</div>
        <div class="xmb-clock-date">Mon, Jan 1</div>
      </div>

      <div class="xmb-categories" id="xmb-categories">
        ${XMB_CATEGORIES.map((cat, index) => `
          <div class="xmb-category ${index === currentCategoryIndex ? 'active' : ''}" data-index="${index}">
            <div class="xmb-category-icon">${cat.icon}</div>
            <span class="xmb-category-label">${cat.label}</span>
          </div>
        `).join('')}
      </div>

      <div class="xmb-items-container">
        <div class="xmb-items" id="xmb-items"></div>
      </div>
    </div>

    <div class="xmb-info-panel">
      <div class="xmb-info-left">
        <div class="xmb-info-title" id="xmb-info-title">Games</div>
        <div class="xmb-info-description" id="xmb-info-description">Select a game to play</div>
      </div>
      <div class="xmb-info-right">
        <div class="xmb-control-hint">
          <span class="xmb-control-key">Arrow Keys</span>
          <span>Navigate</span>
        </div>
        <div class="xmb-control-hint">
          <span class="xmb-control-key">Enter</span>
          <span>Select</span>
        </div>
        <div class="xmb-control-hint">
          <span class="xmb-control-key">Esc</span>
          <span>Exit</span>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(container)

  // Fade in
  requestAnimationFrame(() => {
    container.classList.add('active')
  })

  // Start clock
  updateClock()
  clockInterval = setInterval(updateClock, 1000)

  // Render items for current category
  renderCategoryItems()

  // Setup event listeners
  setupXMBEvents()

  // Hide normal app
  const app = document.getElementById('app')
  if (app) app.style.display = 'none'
}

// Render items for the current category
function renderCategoryItems() {
  const category = XMB_CATEGORIES[currentCategoryIndex]
  const items = categoryItems[category.id] || []
  const itemsContainer = document.getElementById('xmb-items')

  if (!itemsContainer) return

  itemsContainer.innerHTML = items.map((item, index) => `
    <div class="xmb-item ${index === currentItemIndex ? 'active' : ''} ${item.disabled ? 'disabled' : ''}"
         data-index="${index}" data-id="${item.id}" ${item.systemId ? `data-system="${item.systemId}"` : ''}>
      <div class="xmb-item-icon ${item.coverUrl ? 'xmb-item-cover' : ''}">
        ${getItemIcon(item)}
      </div>
      <div class="xmb-item-info">
        <div class="xmb-item-title">${item.title}</div>
        <div class="xmb-item-subtitle">${item.subtitle}</div>
      </div>
    </div>
  `).join('')

  // Update info panel
  updateInfoPanel()

  // Scroll to active item
  scrollToActiveItem()
}

// Update info panel with current selection
function updateInfoPanel() {
  const category = XMB_CATEGORIES[currentCategoryIndex]
  const items = categoryItems[category.id] || []
  const currentItem = items[currentItemIndex]

  const titleEl = document.getElementById('xmb-info-title')
  const descEl = document.getElementById('xmb-info-description')

  if (titleEl && currentItem) {
    titleEl.textContent = currentItem.title
  }
  if (descEl && currentItem) {
    descEl.textContent = currentItem.subtitle || category.label
  }
}

// Scroll to keep active item visible
function scrollToActiveItem() {
  const activeItem = document.querySelector('.xmb-item.active')
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Update category selection visually
function updateCategorySelection() {
  document.querySelectorAll('.xmb-category').forEach((el, index) => {
    el.classList.toggle('active', index === currentCategoryIndex)
  })

  // Reset item index
  currentItemIndex = 0
  renderCategoryItems()
}

// Update item selection visually
function updateItemSelection() {
  document.querySelectorAll('.xmb-item').forEach((el, index) => {
    el.classList.toggle('active', index === currentItemIndex)
  })
  updateInfoPanel()
  scrollToActiveItem()
}

// Handle item selection
function selectCurrentItem() {
  const category = XMB_CATEGORIES[currentCategoryIndex]
  const items = categoryItems[category.id] || []
  const currentItem = items[currentItemIndex]

  if (!currentItem || currentItem.disabled) return

  playSound('select')

  // Handle different item types
  if (currentItem.id.startsWith('game-') && currentItem.gameData) {
    // Launch game
    closeXMB()
    if (onGameSelect) {
      onGameSelect(currentItem.gameData)
    }
  } else if (currentItem.id.startsWith('system-')) {
    // Select system and prompt for ROM
    closeXMB()
    // Trigger system selection in main app
    window.dispatchEvent(new CustomEvent('xmb-select-system', { detail: { systemId: currentItem.systemId } }))
  } else if (currentItem.id === 'signin' || currentItem.id === 'signin-network') {
    closeXMB()
    renderAuthModal('login')
  } else if (currentItem.id === 'signout') {
    // Sign out
    import('../lib/supabase.js').then(({ auth }) => {
      auth.signOut()
      buildCategoryItems()
      renderCategoryItems()
    })
  } else if (currentItem.id === 'appearance' || currentItem.id === 'emulation' ||
             currentItem.id === 'audio' || currentItem.id === 'controls' || currentItem.id === 'data') {
    closeXMB()
    setTimeout(() => {
      renderSettingsModal()
      // Navigate to the correct section
      setTimeout(() => {
        const btn = document.querySelector(`.settings-nav-btn[data-section="${currentItem.id}"]`)
        if (btn) btn.click()
      }, 100)
    }, 300)
  } else if (currentItem.id === 'cloud-library') {
    closeXMB()
    import('./libraryManager.js').then(({ renderLibraryManager }) => {
      renderLibraryManager()
    })
  } else if (currentItem.id === 'achievements') {
    closeXMB()
    import('./leaderboardsModal.js').then(({ renderLeaderboardsModal }) => {
      renderLeaderboardsModal()
    })
  }
}

// Navigate categories (horizontal)
function navigateCategory(direction) {
  const newIndex = currentCategoryIndex + direction
  if (newIndex >= 0 && newIndex < XMB_CATEGORIES.length) {
    currentCategoryIndex = newIndex
    playSound('navigate')
    updateCategorySelection()
  }
}

// Navigate items (vertical)
function navigateItem(direction) {
  const category = XMB_CATEGORIES[currentCategoryIndex]
  const items = categoryItems[category.id] || []
  const newIndex = currentItemIndex + direction

  if (newIndex >= 0 && newIndex < items.length) {
    currentItemIndex = newIndex
    // Skip disabled items
    if (items[currentItemIndex]?.disabled && direction !== 0) {
      navigateItem(direction)
      return
    }
    playSound('navigate')
    updateItemSelection()
  }
}

// Setup XMB event listeners
function setupXMBEvents() {
  // Exit button
  document.getElementById('xmb-exit')?.addEventListener('click', closeXMB)

  // Category clicks
  document.querySelectorAll('.xmb-category').forEach(el => {
    el.addEventListener('click', () => {
      const index = parseInt(el.dataset.index)
      if (index !== currentCategoryIndex) {
        currentCategoryIndex = index
        playSound('navigate')
        updateCategorySelection()
      }
    })
  })

  // Item clicks
  document.getElementById('xmb-items')?.addEventListener('click', (e) => {
    const item = e.target.closest('.xmb-item')
    if (item && !item.classList.contains('disabled')) {
      const index = parseInt(item.dataset.index)
      if (index === currentItemIndex) {
        selectCurrentItem()
      } else {
        currentItemIndex = index
        playSound('navigate')
        updateItemSelection()
      }
    }
  })

  // Keyboard navigation
  document.addEventListener('keydown', handleXMBKeydown)

  // Gamepad support
  window.addEventListener('gamepadconnected', setupGamepadPolling)
}

// Keyboard handler
function handleXMBKeydown(e) {
  if (!xmbActive) return

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      navigateCategory(-1)
      break
    case 'ArrowRight':
      e.preventDefault()
      navigateCategory(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      navigateItem(-1)
      break
    case 'ArrowDown':
      e.preventDefault()
      navigateItem(1)
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      selectCurrentItem()
      break
    case 'Escape':
    case 'Backspace':
      e.preventDefault()
      closeXMB()
      break
  }
}

// Gamepad polling for navigation
let gamepadInterval = null
let lastGamepadInput = 0

function setupGamepadPolling() {
  if (gamepadInterval) return

  gamepadInterval = setInterval(() => {
    if (!xmbActive) return

    const gamepads = navigator.getGamepads()
    for (const gamepad of gamepads) {
      if (!gamepad) continue

      const now = Date.now()
      if (now - lastGamepadInput < 200) continue // Debounce

      // D-pad or left stick
      const leftRight = gamepad.axes[0]
      const upDown = gamepad.axes[1]

      if (leftRight < -0.5) { navigateCategory(-1); lastGamepadInput = now }
      else if (leftRight > 0.5) { navigateCategory(1); lastGamepadInput = now }
      else if (upDown < -0.5) { navigateItem(-1); lastGamepadInput = now }
      else if (upDown > 0.5) { navigateItem(1); lastGamepadInput = now }

      // A button (cross on PS) - select
      if (gamepad.buttons[0]?.pressed) { selectCurrentItem(); lastGamepadInput = now }
      // B button (circle on PS) - back
      if (gamepad.buttons[1]?.pressed) { closeXMB(); lastGamepadInput = now }
    }
  }, 50)
}

// Close XMB
export function closeXMB() {
  if (!xmbActive) return

  xmbActive = false

  // Remove keyboard listener
  document.removeEventListener('keydown', handleXMBKeydown)

  // Stop clock
  if (clockInterval) {
    clearInterval(clockInterval)
    clockInterval = null
  }

  // Stop gamepad polling
  if (gamepadInterval) {
    clearInterval(gamepadInterval)
    gamepadInterval = null
  }

  // Fade out and remove
  const container = document.getElementById('xmb-container')
  if (container) {
    container.classList.remove('active')
    setTimeout(() => {
      container.remove()
    }, 500)
  }

  // Show normal app
  const app = document.getElementById('app')
  if (app) app.style.display = ''
}

// Check if XMB is active
export function isXMBActive() {
  return xmbActive
}

// Toggle XMB mode
export function toggleXMB(gameSelectCallback) {
  if (xmbActive) {
    closeXMB()
  } else {
    renderXMB(gameSelectCallback)
  }
}

// Refresh XMB items (e.g., after adding a game)
export function refreshXMB() {
  if (!xmbActive) return
  buildCategoryItems()
  renderCategoryItems()
}
