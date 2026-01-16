// PixelVault Enhancements
// Auto-resume, Gamepad, Ratings, Streaks, Search History, Import/Export

const STORAGE_KEYS = {
  AUTO_RESUME: 'pixelvault_auto_resume',
  SEARCH_HISTORY: 'pixelvault_search_history',
  GAME_RATINGS: 'pixelvault_ratings',
  PLAY_STREAKS: 'pixelvault_streaks',
  PINNED_GAMES: 'pixelvault_pinned',
}

// ============================================
// AUTO-RESUME
// ============================================
export function getAutoResumeState(gameId) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTO_RESUME) || '{}')
    return data[gameId] || null
  } catch {
    return null
  }
}

export function saveAutoResumeState(gameId, gameName, systemId, stateData) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTO_RESUME) || '{}')
    data[gameId] = {
      gameId,
      gameName,
      systemId,
      stateData, // base64 encoded save state
      timestamp: Date.now(),
    }
    // Keep only last 10 auto-resume states
    const entries = Object.entries(data)
    if (entries.length > 10) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      const trimmed = Object.fromEntries(entries.slice(0, 10))
      localStorage.setItem(STORAGE_KEYS.AUTO_RESUME, JSON.stringify(trimmed))
    } else {
      localStorage.setItem(STORAGE_KEYS.AUTO_RESUME, JSON.stringify(data))
    }
    return true
  } catch (e) {
    console.error('Failed to save auto-resume state:', e)
    return false
  }
}

export function clearAutoResumeState(gameId) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTO_RESUME) || '{}')
    delete data[gameId]
    localStorage.setItem(STORAGE_KEYS.AUTO_RESUME, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to clear auto-resume state:', e)
  }
}

export function getAllAutoResumeStates() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTO_RESUME) || '{}')
  } catch {
    return {}
  }
}

// ============================================
// GAMEPAD SUPPORT
// ============================================
let gamepadPollInterval = null
let gamepadCallbacks = {
  onButtonPress: null,
  onAxisMove: null,
}
let lastButtonStates = {}

export function initGamepadSupport(callbacks = {}) {
  gamepadCallbacks = { ...gamepadCallbacks, ...callbacks }

  window.addEventListener('gamepadconnected', (e) => {
    console.log('Gamepad connected:', e.gamepad.id)
    showGamepadNotification('connected', e.gamepad.id)
    startGamepadPolling()
  })

  window.addEventListener('gamepaddisconnected', (e) => {
    console.log('Gamepad disconnected:', e.gamepad.id)
    showGamepadNotification('disconnected', e.gamepad.id)
    if (navigator.getGamepads().filter(g => g).length === 0) {
      stopGamepadPolling()
    }
  })

  // Check if gamepad already connected
  const gamepads = navigator.getGamepads()
  if (gamepads.some(g => g)) {
    startGamepadPolling()
  }
}

function startGamepadPolling() {
  if (gamepadPollInterval) return
  gamepadPollInterval = setInterval(pollGamepads, 16) // ~60fps
}

function stopGamepadPolling() {
  if (gamepadPollInterval) {
    clearInterval(gamepadPollInterval)
    gamepadPollInterval = null
  }
}

function pollGamepads() {
  const gamepads = navigator.getGamepads()

  for (const gamepad of gamepads) {
    if (!gamepad) continue

    const id = gamepad.index
    if (!lastButtonStates[id]) {
      lastButtonStates[id] = gamepad.buttons.map(b => b.pressed)
    }

    // Check buttons
    gamepad.buttons.forEach((button, index) => {
      const wasPressed = lastButtonStates[id][index]
      const isPressed = button.pressed

      if (isPressed && !wasPressed && gamepadCallbacks.onButtonPress) {
        gamepadCallbacks.onButtonPress(id, index, button.value)
      }

      lastButtonStates[id][index] = isPressed
    })

    // Check axes (for menu navigation)
    if (gamepadCallbacks.onAxisMove) {
      const deadzone = 0.5
      gamepad.axes.forEach((value, index) => {
        if (Math.abs(value) > deadzone) {
          gamepadCallbacks.onAxisMove(id, index, value)
        }
      })
    }
  }
}

function showGamepadNotification(status, gamepadId) {
  const event = new CustomEvent('showToast', {
    detail: {
      message: status === 'connected'
        ? `Controller connected: ${gamepadId.split('(')[0].trim()}`
        : 'Controller disconnected',
      type: status === 'connected' ? 'success' : 'info'
    }
  })
  window.dispatchEvent(event)
}

export function getConnectedGamepads() {
  return Array.from(navigator.getGamepads()).filter(g => g)
}

// Standard button mappings
export const GAMEPAD_BUTTONS = {
  A: 0, B: 1, X: 2, Y: 3,
  LB: 4, RB: 5, LT: 6, RT: 7,
  SELECT: 8, START: 9,
  L3: 10, R3: 11,
  DPAD_UP: 12, DPAD_DOWN: 13, DPAD_LEFT: 14, DPAD_RIGHT: 15,
  HOME: 16,
}

// ============================================
// SEARCH HISTORY
// ============================================
const MAX_SEARCH_HISTORY = 10

export function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]')
  } catch {
    return []
  }
}

export function addToSearchHistory(query) {
  if (!query || query.trim().length < 2) return

  const trimmed = query.trim()
  let history = getSearchHistory()

  // Remove if already exists
  history = history.filter(h => h.toLowerCase() !== trimmed.toLowerCase())

  // Add to front
  history.unshift(trimmed)

  // Keep only recent
  history = history.slice(0, MAX_SEARCH_HISTORY)

  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history))
  return history
}

export function clearSearchHistory() {
  localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY)
}

export function removeFromSearchHistory(query) {
  let history = getSearchHistory()
  history = history.filter(h => h !== query)
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history))
  return history
}

// ============================================
// GAME RATINGS
// ============================================
export function getGameRating(gameId) {
  try {
    const ratings = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_RATINGS) || '{}')
    return ratings[gameId] || 0
  } catch {
    return 0
  }
}

export function setGameRating(gameId, rating) {
  try {
    const ratings = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_RATINGS) || '{}')
    if (rating === 0) {
      delete ratings[gameId]
    } else {
      ratings[gameId] = Math.min(5, Math.max(1, rating))
    }
    localStorage.setItem(STORAGE_KEYS.GAME_RATINGS, JSON.stringify(ratings))
    return ratings[gameId] || 0
  } catch {
    return 0
  }
}

export function getAllRatings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_RATINGS) || '{}')
  } catch {
    return {}
  }
}

// ============================================
// PLAY STREAKS
// ============================================
export function getPlayStreaks() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAY_STREAKS) || '{}')
    return {
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      lastPlayDate: data.lastPlayDate || null,
      playDates: data.playDates || [],
    }
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastPlayDate: null, playDates: [] }
  }
}

export function recordPlaySession() {
  const today = new Date().toISOString().split('T')[0]
  const streaks = getPlayStreaks()

  // Already played today
  if (streaks.lastPlayDate === today) {
    return streaks
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = 1
  if (streaks.lastPlayDate === yesterday) {
    // Continuing streak
    newStreak = streaks.currentStreak + 1
  }

  const updatedStreaks = {
    currentStreak: newStreak,
    longestStreak: Math.max(streaks.longestStreak, newStreak),
    lastPlayDate: today,
    playDates: [...new Set([...streaks.playDates, today])].slice(-365), // Keep 1 year
  }

  localStorage.setItem(STORAGE_KEYS.PLAY_STREAKS, JSON.stringify(updatedStreaks))

  // Show streak notification if milestone
  if (newStreak > 1 && (newStreak % 7 === 0 || newStreak === streaks.longestStreak + 1)) {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        message: newStreak === streaks.longestStreak + 1
          ? `New record! ${newStreak} day streak!`
          : `${newStreak} day streak! Keep it up!`,
        type: 'success'
      }
    }))
  }

  return updatedStreaks
}

export function getStreakCalendar(weeks = 12) {
  const streaks = getPlayStreaks()
  const playDatesSet = new Set(streaks.playDates)

  const calendar = []
  const today = new Date()

  // Start from weeks ago, on Sunday
  const start = new Date(today)
  start.setDate(start.getDate() - (weeks * 7) - start.getDay())

  for (let i = 0; i < weeks * 7 + today.getDay() + 1; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    calendar.push({
      date: dateStr,
      played: playDatesSet.has(dateStr),
      isToday: dateStr === today.toISOString().split('T')[0],
      isFuture: date > today,
    })
  }

  return calendar
}

// ============================================
// PINNED/QUICK LAUNCH GAMES
// ============================================
export function getPinnedGames() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PINNED_GAMES) || '[]')
  } catch {
    return []
  }
}

export function pinGame(gameId, slot = null) {
  const pinned = getPinnedGames()

  // Remove if already pinned
  const filtered = pinned.filter(p => p.gameId !== gameId)

  if (slot !== null && slot >= 1 && slot <= 9) {
    // Pin to specific slot
    const existing = filtered.filter(p => p.slot !== slot)
    existing.push({ gameId, slot })
    existing.sort((a, b) => a.slot - b.slot)
    localStorage.setItem(STORAGE_KEYS.PINNED_GAMES, JSON.stringify(existing))
    return existing
  } else {
    // Find next available slot
    const usedSlots = new Set(filtered.map(p => p.slot))
    let nextSlot = 1
    while (usedSlots.has(nextSlot) && nextSlot <= 9) nextSlot++

    if (nextSlot <= 9) {
      filtered.push({ gameId, slot: nextSlot })
      filtered.sort((a, b) => a.slot - b.slot)
      localStorage.setItem(STORAGE_KEYS.PINNED_GAMES, JSON.stringify(filtered))
    }
    return filtered
  }
}

export function unpinGame(gameId) {
  const pinned = getPinnedGames().filter(p => p.gameId !== gameId)
  localStorage.setItem(STORAGE_KEYS.PINNED_GAMES, JSON.stringify(pinned))
  return pinned
}

export function getPinnedGameBySlot(slot) {
  const pinned = getPinnedGames()
  return pinned.find(p => p.slot === slot)
}

export function isGamePinned(gameId) {
  return getPinnedGames().some(p => p.gameId === gameId)
}

// ============================================
// IMPORT/EXPORT
// ============================================
export async function exportAllData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    recentGames: JSON.parse(localStorage.getItem('retroplay_recent') || '[]'),
    favorites: JSON.parse(localStorage.getItem('pixelvault_favorites') || '[]'),
    collections: JSON.parse(localStorage.getItem('pixelvault_collections') || '[]'),
    ratings: getAllRatings(),
    notes: JSON.parse(localStorage.getItem('pixelvault_notes') || '{}'),
    stats: JSON.parse(localStorage.getItem('pixelvault_stats') || '{}'),
    streaks: getPlayStreaks(),
    pinnedGames: getPinnedGames(),
    searchHistory: getSearchHistory(),
    settings: {
      theme: localStorage.getItem('pixelvault_theme'),
      volume: localStorage.getItem('pixelvault_volume'),
    },
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `pixelvault-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return true
}

export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)

        if (!data.version) {
          throw new Error('Invalid backup file')
        }

        // Import each data type
        if (data.recentGames) {
          localStorage.setItem('retroplay_recent', JSON.stringify(data.recentGames))
        }
        if (data.favorites) {
          localStorage.setItem('pixelvault_favorites', JSON.stringify(data.favorites))
        }
        if (data.collections) {
          localStorage.setItem('pixelvault_collections', JSON.stringify(data.collections))
        }
        if (data.ratings) {
          localStorage.setItem(STORAGE_KEYS.GAME_RATINGS, JSON.stringify(data.ratings))
        }
        if (data.notes) {
          localStorage.setItem('pixelvault_notes', JSON.stringify(data.notes))
        }
        if (data.stats) {
          localStorage.setItem('pixelvault_stats', JSON.stringify(data.stats))
        }
        if (data.streaks) {
          localStorage.setItem(STORAGE_KEYS.PLAY_STREAKS, JSON.stringify(data.streaks))
        }
        if (data.pinnedGames) {
          localStorage.setItem(STORAGE_KEYS.PINNED_GAMES, JSON.stringify(data.pinnedGames))
        }
        if (data.searchHistory) {
          localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(data.searchHistory))
        }
        if (data.settings) {
          if (data.settings.theme) localStorage.setItem('pixelvault_theme', data.settings.theme)
          if (data.settings.volume) localStorage.setItem('pixelvault_volume', data.settings.volume)
        }

        resolve({
          success: true,
          gamesImported: data.recentGames?.length || 0,
          collectionsImported: data.collections?.length || 0,
        })
      } catch (err) {
        reject(new Error('Failed to parse backup file: ' + err.message))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// ============================================
// HAPTIC FEEDBACK
// ============================================
export function hapticFeedback(type = 'light') {
  if (!navigator.vibrate) return false

  switch (type) {
    case 'light':
      navigator.vibrate(10)
      break
    case 'medium':
      navigator.vibrate(25)
      break
    case 'heavy':
      navigator.vibrate(50)
      break
    case 'success':
      navigator.vibrate([10, 50, 10])
      break
    case 'error':
      navigator.vibrate([50, 30, 50])
      break
    case 'selection':
      navigator.vibrate(5)
      break
    default:
      navigator.vibrate(10)
  }

  return true
}

// ============================================
// LAZY LOADING
// ============================================
let imageObserver = null

export function initLazyLoading() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src
    })
    return
  }

  imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        if (img.dataset.src) {
          img.src = img.dataset.src
          img.removeAttribute('data-src')
          img.classList.add('loaded')
        }
        imageObserver.unobserve(img)
      }
    })
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  })
}

export function observeImage(img) {
  if (imageObserver && img.dataset.src) {
    imageObserver.observe(img)
  }
}

export function observeAllImages(container = document) {
  if (!imageObserver) initLazyLoading()
  container.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img)
  })
}

// ============================================
// VIRTUAL SCROLLING
// ============================================
export class VirtualScroller {
  constructor(container, options = {}) {
    this.container = container
    this.items = []
    this.itemHeight = options.itemHeight || 200
    this.itemsPerRow = options.itemsPerRow || 4
    this.buffer = options.buffer || 2 // Extra rows to render
    this.renderItem = options.renderItem || ((item) => `<div>${item}</div>`)

    this.scrollTop = 0
    this.visibleStart = 0
    this.visibleEnd = 0

    this.viewport = null
    this.content = null

    this.init()
  }

  init() {
    // Create viewport structure
    this.viewport = document.createElement('div')
    this.viewport.className = 'virtual-scroll-viewport'
    this.viewport.style.cssText = 'overflow-y: auto; height: 100%;'

    this.content = document.createElement('div')
    this.content.className = 'virtual-scroll-content'
    this.content.style.cssText = 'position: relative;'

    this.viewport.appendChild(this.content)
    this.container.appendChild(this.viewport)

    this.viewport.addEventListener('scroll', () => this.onScroll())

    // Handle resize
    this.resizeObserver = new ResizeObserver(() => this.recalculate())
    this.resizeObserver.observe(this.container)
  }

  setItems(items) {
    this.items = items
    this.recalculate()
    this.render()
  }

  recalculate() {
    const containerWidth = this.container.clientWidth
    // Recalculate items per row based on container width
    if (containerWidth < 400) {
      this.itemsPerRow = 1
    } else if (containerWidth < 600) {
      this.itemsPerRow = 2
    } else if (containerWidth < 900) {
      this.itemsPerRow = 3
    } else {
      this.itemsPerRow = 4
    }

    const totalRows = Math.ceil(this.items.length / this.itemsPerRow)
    const totalHeight = totalRows * this.itemHeight
    this.content.style.height = `${totalHeight}px`
  }

  onScroll() {
    this.scrollTop = this.viewport.scrollTop
    this.render()
  }

  render() {
    const viewportHeight = this.viewport.clientHeight
    const rowHeight = this.itemHeight

    const startRow = Math.max(0, Math.floor(this.scrollTop / rowHeight) - this.buffer)
    const endRow = Math.min(
      Math.ceil(this.items.length / this.itemsPerRow),
      Math.ceil((this.scrollTop + viewportHeight) / rowHeight) + this.buffer
    )

    const startIndex = startRow * this.itemsPerRow
    const endIndex = Math.min(this.items.length, endRow * this.itemsPerRow)

    if (startIndex === this.visibleStart && endIndex === this.visibleEnd) {
      return // No change needed
    }

    this.visibleStart = startIndex
    this.visibleEnd = endIndex

    const visibleItems = this.items.slice(startIndex, endIndex)
    const offsetY = startRow * rowHeight

    this.content.innerHTML = `
      <div class="virtual-scroll-items" style="
        display: grid;
        grid-template-columns: repeat(${this.itemsPerRow}, 1fr);
        gap: 1rem;
        position: absolute;
        top: ${offsetY}px;
        left: 0;
        right: 0;
        padding: 0 1rem;
      ">
        ${visibleItems.map((item, i) => this.renderItem(item, startIndex + i)).join('')}
      </div>
    `
  }

  destroy() {
    this.resizeObserver?.disconnect()
    this.viewport?.remove()
  }
}

// ============================================
// LOADING SKELETONS
// ============================================
export function createSkeleton(type = 'card') {
  const skeletons = {
    card: `
      <div class="skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      </div>
    `,
    text: `<div class="skeleton skeleton-text"></div>`,
    avatar: `<div class="skeleton skeleton-avatar"></div>`,
    button: `<div class="skeleton skeleton-button"></div>`,
    grid: `
      <div class="skeleton-grid">
        ${Array(8).fill('<div class="skeleton-card"><div class="skeleton skeleton-image"></div><div class="skeleton-content"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div></div>').join('')}
      </div>
    `,
  }

  return skeletons[type] || skeletons.card
}

export function showSkeletonLoader(container, type = 'grid', count = 8) {
  if (type === 'grid') {
    container.innerHTML = `
      <div class="skeleton-grid">
        ${Array(count).fill(createSkeleton('card')).join('')}
      </div>
    `
  } else {
    container.innerHTML = Array(count).fill(createSkeleton(type)).join('')
  }
}
