// Emulator enhancements - rewind, fast forward, shaders, cheats
import { loadSettings, saveSettings } from './themes.js'

// ============================================
// SHADER EFFECTS
// ============================================
export const SHADERS = {
  none: {
    id: 'none',
    name: 'None',
    filter: 'none',
    description: 'No filter applied'
  },
  crt: {
    id: 'crt',
    name: 'CRT',
    filter: 'contrast(1.1) brightness(0.9)',
    overlay: true,
    overlayStyle: `
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15) 0px,
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
      );
    `,
    description: 'Classic CRT scanlines'
  },
  lcd: {
    id: 'lcd',
    name: 'LCD Grid',
    filter: 'contrast(1.05)',
    overlay: true,
    overlayStyle: `
      background:
        repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, transparent 1px, transparent 3px),
        repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, transparent 1px, transparent 3px);
    `,
    description: 'LCD pixel grid effect'
  },
  vhs: {
    id: 'vhs',
    name: 'VHS',
    filter: 'saturate(1.3) contrast(1.1) blur(0.3px)',
    description: 'Retro VHS tape look'
  },
  gameboy: {
    id: 'gameboy',
    name: 'Game Boy',
    filter: 'sepia(0.5) hue-rotate(60deg) saturate(0.8) contrast(1.2)',
    description: 'Classic green DMG screen'
  },
  blackwhite: {
    id: 'blackwhite',
    name: 'Black & White',
    filter: 'grayscale(1) contrast(1.1)',
    description: 'Monochrome display'
  },
  sepia: {
    id: 'sepia',
    name: 'Sepia',
    filter: 'sepia(0.8)',
    description: 'Vintage sepia tone'
  },
  highContrast: {
    id: 'highContrast',
    name: 'High Contrast',
    filter: 'contrast(1.4) saturate(1.2)',
    description: 'Enhanced colors and contrast'
  }
}

let currentShaderOverlay = null

export function applyShader(shaderId) {
  const shader = SHADERS[shaderId] || SHADERS.none
  const gameContainer = document.getElementById('game')
  const emulatorContainer = document.getElementById('emulator-container')

  if (!gameContainer) return

  // Apply CSS filter
  gameContainer.style.filter = shader.filter

  // Remove existing overlay
  if (currentShaderOverlay) {
    currentShaderOverlay.remove()
    currentShaderOverlay = null
  }

  // Add overlay if needed
  if (shader.overlay && emulatorContainer) {
    currentShaderOverlay = document.createElement('div')
    currentShaderOverlay.className = 'shader-overlay'
    currentShaderOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 10;
      ${shader.overlayStyle}
    `
    emulatorContainer.style.position = 'relative'
    emulatorContainer.appendChild(currentShaderOverlay)
  }

  // Save preference
  const settings = loadSettings()
  settings.shader = shaderId
  saveSettings(settings)
}

// ============================================
// SPEED CONTROLS (Fast Forward / Slow Motion)
// ============================================
let currentSpeed = 1
let speedIndicator = null

export function setEmulatorSpeed(speed) {
  if (!window.EJS_emulator) return

  currentSpeed = speed

  try {
    // EmulatorJS speed control
    if (window.EJS_emulator.setFastForwardRatio) {
      window.EJS_emulator.setFastForwardRatio(speed)
    }
  } catch (e) {
    console.log('Speed control not available')
  }

  showSpeedIndicator(speed)
}

export function toggleFastForward() {
  setEmulatorSpeed(currentSpeed === 1 ? 2 : 1)
}

export function toggleSlowMotion() {
  setEmulatorSpeed(currentSpeed === 1 ? 0.5 : 1)
}

function showSpeedIndicator(speed) {
  if (speedIndicator) speedIndicator.remove()

  if (speed === 1) return

  speedIndicator = document.createElement('div')
  speedIndicator.className = 'speed-indicator'
  speedIndicator.textContent = speed > 1 ? `${speed}x Fast` : `${speed}x Slow`
  document.getElementById('emulator-container')?.appendChild(speedIndicator)

  // Auto-hide after 2 seconds if still same speed
  setTimeout(() => {
    if (currentSpeed === speed && speedIndicator) {
      speedIndicator.classList.add('fade-out')
    }
  }, 2000)
}

// ============================================
// REWIND
// ============================================
let rewindStates = []
let rewindInterval = null
const MAX_REWIND_STATES = 300 // ~5 seconds at 60fps capture rate
const REWIND_CAPTURE_INTERVAL = 100 // ms

export function startRewindCapture() {
  if (rewindInterval) return

  rewindInterval = setInterval(() => {
    if (!window.EJS_emulator) return

    try {
      const state = window.EJS_emulator.gameManager.getState()
      if (state) {
        rewindStates.push({
          state: state,
          timestamp: Date.now()
        })
        // Keep only recent states
        if (rewindStates.length > MAX_REWIND_STATES) {
          rewindStates.shift()
        }
      }
    } catch (e) {
      // State capture not available
    }
  }, REWIND_CAPTURE_INTERVAL)
}

export function stopRewindCapture() {
  if (rewindInterval) {
    clearInterval(rewindInterval)
    rewindInterval = null
  }
}

export function rewind(seconds = 1) {
  if (!window.EJS_emulator || rewindStates.length === 0) return false

  const targetTime = Date.now() - (seconds * 1000)
  let targetState = null

  // Find the state closest to target time
  for (let i = rewindStates.length - 1; i >= 0; i--) {
    if (rewindStates[i].timestamp <= targetTime) {
      targetState = rewindStates[i]
      // Remove states after this point
      rewindStates = rewindStates.slice(0, i + 1)
      break
    }
  }

  if (!targetState && rewindStates.length > 0) {
    targetState = rewindStates[0]
    rewindStates = [targetState]
  }

  if (targetState) {
    try {
      window.EJS_emulator.gameManager.loadState(targetState.state)
      showRewindIndicator()
      return true
    } catch (e) {
      console.log('Rewind failed:', e)
    }
  }

  return false
}

function showRewindIndicator() {
  const indicator = document.createElement('div')
  indicator.className = 'rewind-indicator'
  indicator.innerHTML = '&#9194; Rewind'
  document.getElementById('emulator-container')?.appendChild(indicator)
  setTimeout(() => indicator.remove(), 500)
}

export function clearRewindStates() {
  rewindStates = []
}

// ============================================
// CHEATS / GAME GENIE
// ============================================
const CHEATS_KEY = 'pixelvault_cheats'

export function getGameCheats(gameId) {
  try {
    const cheats = JSON.parse(localStorage.getItem(CHEATS_KEY) || '{}')
    return cheats[gameId] || []
  } catch {
    return []
  }
}

export function saveGameCheats(gameId, cheats) {
  try {
    const allCheats = JSON.parse(localStorage.getItem(CHEATS_KEY) || '{}')
    allCheats[gameId] = cheats
    localStorage.setItem(CHEATS_KEY, JSON.stringify(allCheats))
  } catch (e) {
    console.error('Failed to save cheats:', e)
  }
}

export function addCheat(gameId, name, code) {
  const cheats = getGameCheats(gameId)
  cheats.push({
    id: `cheat_${Date.now()}`,
    name,
    code,
    enabled: false
  })
  saveGameCheats(gameId, cheats)
  return cheats
}

export function removeCheat(gameId, cheatId) {
  const cheats = getGameCheats(gameId).filter(c => c.id !== cheatId)
  saveGameCheats(gameId, cheats)
  return cheats
}

export function toggleCheat(gameId, cheatId) {
  const cheats = getGameCheats(gameId)
  const cheat = cheats.find(c => c.id === cheatId)
  if (cheat) {
    cheat.enabled = !cheat.enabled
    saveGameCheats(gameId, cheats)
    applyCheat(cheat)
  }
  return cheats
}

function applyCheat(cheat) {
  if (!window.EJS_emulator) return

  try {
    // EmulatorJS cheat application
    if (cheat.enabled) {
      window.EJS_emulator.gameManager.setCheat(cheat.code, true)
    } else {
      window.EJS_emulator.gameManager.setCheat(cheat.code, false)
    }
  } catch (e) {
    console.log('Cheat system not available:', e)
  }
}

export function applyAllCheats(gameId) {
  const cheats = getGameCheats(gameId)
  cheats.filter(c => c.enabled).forEach(applyCheat)
}

// ============================================
// CONTROL REMAPPING
// ============================================
const CONTROLS_KEY = 'pixelvault_controls'

export const DEFAULT_CONTROLS = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  a: 'KeyX',
  b: 'KeyZ',
  x: 'KeyS',
  y: 'KeyA',
  start: 'Enter',
  select: 'ShiftRight',
  l: 'KeyQ',
  r: 'KeyE',
  l2: 'Digit1',
  r2: 'Digit2'
}

export function getControls(gameId = null) {
  try {
    const controls = JSON.parse(localStorage.getItem(CONTROLS_KEY) || '{}')
    if (gameId && controls[gameId]) {
      return { ...DEFAULT_CONTROLS, ...controls[gameId] }
    }
    return { ...DEFAULT_CONTROLS, ...(controls.global || {}) }
  } catch {
    return { ...DEFAULT_CONTROLS }
  }
}

export function saveControls(controls, gameId = null) {
  try {
    const allControls = JSON.parse(localStorage.getItem(CONTROLS_KEY) || '{}')
    if (gameId) {
      allControls[gameId] = controls
    } else {
      allControls.global = controls
    }
    localStorage.setItem(CONTROLS_KEY, JSON.stringify(allControls))
  } catch (e) {
    console.error('Failed to save controls:', e)
  }
}

export function resetControls(gameId = null) {
  try {
    const allControls = JSON.parse(localStorage.getItem(CONTROLS_KEY) || '{}')
    if (gameId) {
      delete allControls[gameId]
    } else {
      delete allControls.global
    }
    localStorage.setItem(CONTROLS_KEY, JSON.stringify(allControls))
  } catch (e) {
    console.error('Failed to reset controls:', e)
  }
  return { ...DEFAULT_CONTROLS }
}

// ============================================
// TURBO MODE
// ============================================
let turboEnabled = false
let turboButtons = new Set()
let turboInterval = null

export function setTurboMode(enabled, buttons = ['a', 'b']) {
  turboEnabled = enabled
  turboButtons = new Set(buttons)

  if (turboInterval) {
    clearInterval(turboInterval)
    turboInterval = null
  }

  if (enabled && window.EJS_emulator) {
    turboInterval = setInterval(() => {
      // Toggle turbo buttons rapidly
      turboButtons.forEach(btn => {
        // This would need to interface with EmulatorJS input system
      })
    }, 33) // ~30Hz turbo
  }
}

// ============================================
// ACCESSIBILITY FILTERS
// ============================================
export const COLORBLIND_FILTERS = {
  none: {
    id: 'none',
    name: 'None',
    filter: 'none'
  },
  protanopia: {
    id: 'protanopia',
    name: 'Protanopia',
    filter: 'url(#protanopia)'
  },
  deuteranopia: {
    id: 'deuteranopia',
    name: 'Deuteranopia',
    filter: 'url(#deuteranopia)'
  },
  tritanopia: {
    id: 'tritanopia',
    name: 'Tritanopia',
    filter: 'url(#tritanopia)'
  }
}

export function applyColorblindFilter(filterId) {
  const filter = COLORBLIND_FILTERS[filterId] || COLORBLIND_FILTERS.none
  const gameContainer = document.getElementById('game')

  if (!gameContainer) return

  // Ensure SVG filters are in the DOM
  ensureColorblindFilters()

  // Apply the filter
  if (filter.id === 'none') {
    gameContainer.style.filter = gameContainer.style.filter.replace(/url\(#\w+\)/g, '').trim() || 'none'
  } else {
    const currentFilter = gameContainer.style.filter || ''
    if (!currentFilter.includes(filter.filter)) {
      gameContainer.style.filter = `${currentFilter} ${filter.filter}`.trim()
    }
  }

  // Save preference
  const settings = loadSettings()
  settings.colorblindFilter = filterId
  saveSettings(settings)
}

function ensureColorblindFilters() {
  if (document.getElementById('colorblind-filters')) return

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.id = 'colorblind-filters'
  svg.style.display = 'none'
  svg.innerHTML = `
    <defs>
      <filter id="protanopia">
        <feColorMatrix type="matrix" values="
          0.567, 0.433, 0,     0, 0
          0.558, 0.442, 0,     0, 0
          0,     0.242, 0.758, 0, 0
          0,     0,     0,     1, 0
        "/>
      </filter>
      <filter id="deuteranopia">
        <feColorMatrix type="matrix" values="
          0.625, 0.375, 0,   0, 0
          0.7,   0.3,   0,   0, 0
          0,     0.3,   0.7, 0, 0
          0,     0,     0,   1, 0
        "/>
      </filter>
      <filter id="tritanopia">
        <feColorMatrix type="matrix" values="
          0.95, 0.05,  0,     0, 0
          0,    0.433, 0.567, 0, 0
          0,    0.475, 0.525, 0, 0
          0,    0,     0,     1, 0
        "/>
      </filter>
    </defs>
  `
  document.body.appendChild(svg)
}

// ============================================
// SCREENSHOT CAPTURE
// ============================================
export function captureScreenshot(gameId, gameName) {
  const gameCanvas = document.querySelector('#game canvas')
  if (!gameCanvas) {
    console.log('No game canvas found')
    return null
  }

  try {
    const dataUrl = gameCanvas.toDataURL('image/png')
    return { gameId, gameName, dataUrl, timestamp: Date.now() }
  } catch (e) {
    console.error('Failed to capture screenshot:', e)
    return null
  }
}
