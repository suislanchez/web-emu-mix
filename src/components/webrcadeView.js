// webЯcade-style View Component
// Console-first browsing with Netflix/TV-style interface

import { toggleFavorite, isFavorite } from '../lib/library.js'
import { loadRecentGames, deleteGameById } from '../lib/store.js'

let currentView = 'consoles' // 'consoles' or 'games'
let selectedConsole = null
let selectedIndex = 0
let selectedCategoryIndex = 0
let featuredItem = null
let onPlayGame = null
let recentGames = []

// Console definitions with logos
const CONSOLES = [
  { id: 'nes', name: 'Nintendo Entertainment System', shortName: 'NES', color: '#e60012',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/NES_logo.svg' },
  { id: 'snes', name: 'Super Nintendo', shortName: 'SNES', color: '#7b5aa6',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/SNES_logo.svg' },
  { id: 'gb', name: 'Game Boy', shortName: 'GB', color: '#8b956d',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Game_Boy_logo.svg' },
  { id: 'gbc', name: 'Game Boy Color', shortName: 'GBC', color: '#4ecdc4',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Game_Boy_Color_logo.svg' },
  { id: 'gba', name: 'Game Boy Advance', shortName: 'GBA', color: '#5a5eb9',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Gameboy_advance_logo.svg' },
  { id: 'nds', name: 'Nintendo DS', shortName: 'NDS', color: '#a0a0a0',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Nintendo_DS_Logo.svg' },
  { id: 'n64', name: 'Nintendo 64', shortName: 'N64', color: '#339947',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo_64_Logo.svg' },
  { id: 'segaMD', name: 'Sega Genesis', shortName: 'Genesis', color: '#17569b',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Sega_Genesis_Logo.svg' },
  { id: 'segaMS', name: 'Sega Master System', shortName: 'SMS', color: '#e60012',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sega_Master_System_Logo.svg' },
  { id: 'segaGG', name: 'Sega Game Gear', shortName: 'GG', color: '#1976d2',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Sega_Game_Gear_Logo.svg' },
  { id: 'psx', name: 'PlayStation', shortName: 'PS1', color: '#003087',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Playstation_logo_colour.svg' },
  { id: 'arcade', name: 'Arcade', shortName: 'Arcade', color: '#ff9800',
    logo: null }
]

export function renderWebrcadeView(container, playGameCallback) {
  onPlayGame = playGameCallback
  recentGames = loadRecentGames()

  // Start at consoles view
  currentView = 'consoles'
  selectedConsole = null
  selectedIndex = 0
  selectedCategoryIndex = 0

  renderCurrentView(container)
}

function renderCurrentView(container) {
  if (currentView === 'consoles') {
    renderConsolesView(container)
  } else {
    renderGamesView(container)
  }
}

function renderConsolesView(container) {
  // Get consoles that have games
  const consolesWithGames = CONSOLES.map(console => {
    const games = recentGames.filter(g => g.systemId === console.id)
    return { ...console, gameCount: games.length }
  })

  // Featured: last played game or first console
  const lastPlayed = recentGames[0]
  featuredItem = lastPlayed ? {
    type: 'game',
    ...lastPlayed
  } : {
    type: 'console',
    ...CONSOLES[0]
  }

  container.innerHTML = `
    <div class="wr-container">
      <header class="wr-header">
        <div class="wr-logo">PixelVault</div>
        <nav class="wr-nav">
          <button class="wr-nav-btn" id="wr-upload-btn" title="Upload ROM">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <button class="wr-nav-btn" id="wr-browse-btn" title="Browse Catalog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <button class="wr-nav-btn" id="wr-settings-btn" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </nav>
      </header>

      ${renderHeroSection(featuredItem)}

      <section class="wr-section">
        <h2 class="wr-section-title">Select Console</h2>
        <div class="wr-carousel-wrapper">
          <button class="wr-carousel-nav wr-nav-left" data-dir="-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="wr-carousel" id="consoles-carousel">
            ${consolesWithGames.map((console, idx) => renderConsoleCard(console, idx)).join('')}
          </div>
          <button class="wr-carousel-nav wr-nav-right" data-dir="1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </section>

      ${recentGames.length > 0 ? `
        <section class="wr-section">
          <h2 class="wr-section-title">Continue Playing</h2>
          <div class="wr-carousel-wrapper">
            <button class="wr-carousel-nav wr-nav-left" data-dir="-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div class="wr-carousel" id="recent-carousel">
              ${recentGames.slice(0, 20).map((game, idx) => renderGameCard(game, idx)).join('')}
            </div>
            <button class="wr-carousel-nav wr-nav-right" data-dir="1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </section>
      ` : ''}
    </div>
  `

  setupEvents(container)
}

function renderGamesView(container) {
  const consoleInfo = CONSOLES.find(c => c.id === selectedConsole) || CONSOLES[0]
  const games = recentGames.filter(g => g.systemId === selectedConsole)

  featuredItem = games[0] || { type: 'console', ...consoleInfo }

  container.innerHTML = `
    <div class="wr-container">
      <header class="wr-header">
        <button class="wr-back-btn" id="wr-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div class="wr-logo">${consoleInfo.name}</div>
        <nav class="wr-nav">
          <button class="wr-nav-btn" id="wr-upload-btn" title="Upload ROM">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <button class="wr-nav-btn" id="wr-browse-btn" title="Browse Catalog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <button class="wr-nav-btn" id="wr-settings-btn" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </nav>
      </header>

      ${games.length > 0 ? renderHeroSection({ type: 'game', ...games[0] }) : renderEmptyConsoleHero(consoleInfo)}

      <section class="wr-section">
        <h2 class="wr-section-title">${consoleInfo.shortName} Games (${games.length})</h2>
        ${games.length > 0 ? `
          <div class="wr-carousel-wrapper">
            <button class="wr-carousel-nav wr-nav-left" data-dir="-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div class="wr-carousel" id="games-carousel">
              ${games.map((game, idx) => renderGameCard(game, idx)).join('')}
            </div>
            <button class="wr-carousel-nav wr-nav-right" data-dir="1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        ` : `
          <div class="wr-empty">
            <p>No games yet for ${consoleInfo.name}</p>
            <p class="wr-empty-hint">Upload a ROM or browse the catalog to add games</p>
            <div class="wr-empty-actions">
              <button class="wr-btn wr-btn-primary" id="wr-empty-upload">Upload ROM</button>
              <button class="wr-btn" id="wr-empty-browse">Browse Catalog</button>
            </div>
          </div>
        `}
      </section>
    </div>
  `

  setupEvents(container)
}

function renderHeroSection(item) {
  if (!item) return ''

  const isGame = item.type === 'game' || item.gameId
  const color = isGame ? getSystemColor(item.systemId) : item.color
  const title = isGame ? item.name : item.name
  const subtitle = isGame ? (item.systemName || item.systemId) : 'Select to browse games'

  return `
    <section class="wr-hero" style="--accent-color: ${color}">
      <div class="wr-hero-bg">
        ${isGame && item.coverUrl ? `<img src="${item.coverUrl}" alt="" />` : ''}
      </div>
      <div class="wr-hero-content">
        <h1 class="wr-hero-title">${title}</h1>
        <p class="wr-hero-subtitle">${subtitle}</p>
        ${isGame ? `
          <p class="wr-hero-desc">${getGameDescription(item)}</p>
          <div class="wr-hero-actions">
            <button class="wr-btn wr-btn-primary wr-btn-play" data-game-id="${item.gameId}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Play
            </button>
            <button class="wr-btn wr-btn-icon ${isFavorite(item.gameId) ? 'active' : ''}" data-favorite="${item.gameId}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFavorite(item.gameId) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
      <div class="wr-hero-art">
        ${isGame && item.coverUrl
          ? `<img src="${item.coverUrl}" alt="${title}" />`
          : item.logo
            ? `<img src="${item.logo}" alt="${title}" class="wr-console-logo" onerror="this.style.display='none'" />`
            : `<div class="wr-hero-placeholder">${getSystemIcon(item.id || item.systemId)}</div>`
        }
      </div>
    </section>
  `
}

function renderEmptyConsoleHero(console) {
  return `
    <section class="wr-hero wr-hero-empty" style="--accent-color: ${console.color}">
      <div class="wr-hero-content">
        <h1 class="wr-hero-title">${console.name}</h1>
        <p class="wr-hero-subtitle">No games in library</p>
        <p class="wr-hero-desc">Upload a ROM file or browse the online catalog to add ${console.shortName} games to your library.</p>
        <div class="wr-hero-actions">
          <button class="wr-btn wr-btn-primary" id="hero-upload-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload ROM
          </button>
          <button class="wr-btn" id="hero-browse-btn">Browse Catalog</button>
        </div>
      </div>
      <div class="wr-hero-art">
        ${console.logo
          ? `<img src="${console.logo}" alt="${console.name}" class="wr-console-logo" onerror="this.style.display='none'" />`
          : `<div class="wr-hero-placeholder">${getSystemIcon(console.id)}</div>`
        }
      </div>
    </section>
  `
}

function renderConsoleCard(console, index) {
  return `
    <div class="wr-card wr-card-console ${index === selectedIndex ? 'selected' : ''}"
         data-console="${console.id}" data-index="${index}" style="--card-color: ${console.color}">
      <div class="wr-card-art">
        ${console.logo
          ? `<img src="${console.logo}" alt="${console.shortName}" onerror="this.parentElement.innerHTML='${getSystemIcon(console.id)}'" />`
          : getSystemIcon(console.id)
        }
      </div>
      <div class="wr-card-info">
        <span class="wr-card-title">${console.shortName}</span>
        ${console.gameCount > 0 ? `<span class="wr-card-count">${console.gameCount} games</span>` : ''}
      </div>
    </div>
  `
}

function renderGameCard(game, index) {
  const color = getSystemColor(game.systemId)
  return `
    <div class="wr-card wr-card-game ${index === selectedIndex ? 'selected' : ''}"
         data-game-id="${game.gameId}" data-index="${index}" style="--card-color: ${color}">
      <div class="wr-card-art">
        ${game.coverUrl
          ? `<img src="${game.coverUrl}" alt="${game.name}" loading="lazy" onerror="this.style.display='none'" />`
          : ''
        }
        <div class="wr-card-placeholder" ${game.coverUrl ? 'style="display:none"' : ''}>
          ${getSystemIcon(game.systemId)}
        </div>
      </div>
      <div class="wr-card-info">
        <span class="wr-card-title">${game.name}</span>
      </div>
    </div>
  `
}

function setupEvents(container) {
  // Navigation buttons
  document.getElementById('wr-back-btn')?.addEventListener('click', () => {
    currentView = 'consoles'
    selectedConsole = null
    selectedIndex = 0
    renderCurrentView(container)
  })

  // Header nav buttons
  document.getElementById('wr-upload-btn')?.addEventListener('click', () => {
    document.getElementById('rom-input')?.click()
  })

  document.getElementById('wr-browse-btn')?.addEventListener('click', () => {
    import('./gameBrowser.js').then(m => m.renderGameBrowser(selectedConsole))
  })

  document.getElementById('wr-settings-btn')?.addEventListener('click', () => {
    import('./settings.js').then(m => m.renderSettingsModal())
  })

  // Empty state buttons
  document.getElementById('wr-empty-upload')?.addEventListener('click', () => {
    document.getElementById('rom-input')?.click()
  })

  document.getElementById('wr-empty-browse')?.addEventListener('click', () => {
    import('./gameBrowser.js').then(m => m.renderGameBrowser(selectedConsole))
  })

  document.getElementById('hero-upload-btn')?.addEventListener('click', () => {
    document.getElementById('rom-input')?.click()
  })

  document.getElementById('hero-browse-btn')?.addEventListener('click', () => {
    import('./gameBrowser.js').then(m => m.renderGameBrowser(selectedConsole))
  })

  // Play button
  container.querySelectorAll('.wr-btn-play').forEach(btn => {
    btn.addEventListener('click', () => {
      const gameId = btn.dataset.gameId
      const game = recentGames.find(g => g.gameId === gameId)
      if (game && onPlayGame) onPlayGame(game)
    })
  })

  // Favorite button
  container.querySelectorAll('[data-favorite]').forEach(btn => {
    btn.addEventListener('click', () => {
      const gameId = btn.dataset.favorite
      toggleFavorite(gameId)
      btn.classList.toggle('active')
      const svg = btn.querySelector('svg')
      svg.setAttribute('fill', btn.classList.contains('active') ? 'currentColor' : 'none')
    })
  })

  // Console cards
  container.querySelectorAll('.wr-card-console').forEach(card => {
    card.addEventListener('click', () => {
      selectedConsole = card.dataset.console
      currentView = 'games'
      selectedIndex = 0
      renderCurrentView(container)
    })
  })

  // Game cards
  container.querySelectorAll('.wr-card-game').forEach(card => {
    card.addEventListener('click', () => {
      const gameId = card.dataset.gameId
      const game = recentGames.find(g => g.gameId === gameId)
      if (game) {
        updateHeroForGame(game)
        selectedIndex = parseInt(card.dataset.index)
        container.querySelectorAll('.wr-card-game').forEach(c => c.classList.remove('selected'))
        card.classList.add('selected')
      }
    })

    card.addEventListener('dblclick', () => {
      const gameId = card.dataset.gameId
      const game = recentGames.find(g => g.gameId === gameId)
      if (game && onPlayGame) onPlayGame(game)
    })
  })

  // Carousel navigation
  container.querySelectorAll('.wr-carousel-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = parseInt(btn.dataset.dir)
      const carousel = btn.parentElement.querySelector('.wr-carousel')
      if (carousel) {
        carousel.scrollBy({ left: dir * 400, behavior: 'smooth' })
      }
    })
  })

  // Keyboard navigation
  document.removeEventListener('keydown', handleKeyNav)
  document.addEventListener('keydown', handleKeyNav)
}

function handleKeyNav(e) {
  // Only handle if webrcade view is active
  if (!document.querySelector('.wr-container')) return

  switch(e.key) {
    case 'ArrowRight':
      e.preventDefault()
      navigateCards(1)
      break
    case 'ArrowLeft':
      e.preventDefault()
      navigateCards(-1)
      break
    case 'Enter':
      e.preventDefault()
      selectCurrentCard()
      break
    case 'Escape':
    case 'Backspace':
      if (currentView === 'games') {
        e.preventDefault()
        document.getElementById('wr-back-btn')?.click()
      }
      break
  }
}

function navigateCards(dir) {
  const cards = document.querySelectorAll('.wr-card')
  if (!cards.length) return

  selectedIndex = Math.max(0, Math.min(cards.length - 1, selectedIndex + dir))

  cards.forEach((card, i) => {
    card.classList.toggle('selected', i === selectedIndex)
  })

  cards[selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })

  // Update hero if it's a game
  if (currentView === 'games') {
    const gameId = cards[selectedIndex]?.dataset.gameId
    const game = recentGames.find(g => g.gameId === gameId)
    if (game) updateHeroForGame(game)
  }
}

function selectCurrentCard() {
  const card = document.querySelector('.wr-card.selected')
  if (!card) return

  if (currentView === 'consoles') {
    card.click()
  } else {
    // Play the game
    const gameId = card.dataset.gameId
    const game = recentGames.find(g => g.gameId === gameId)
    if (game && onPlayGame) onPlayGame(game)
  }
}

function updateHeroForGame(game) {
  const hero = document.querySelector('.wr-hero')
  if (!hero) return

  const title = hero.querySelector('.wr-hero-title')
  const subtitle = hero.querySelector('.wr-hero-subtitle')
  const desc = hero.querySelector('.wr-hero-desc')
  const bg = hero.querySelector('.wr-hero-bg img')
  const art = hero.querySelector('.wr-hero-art img')
  const playBtn = hero.querySelector('.wr-btn-play')
  const favBtn = hero.querySelector('[data-favorite]')

  if (title) title.textContent = game.name
  if (subtitle) subtitle.textContent = game.systemName || game.systemId
  if (desc) desc.textContent = getGameDescription(game)
  if (bg) bg.src = game.coverUrl || ''
  if (art) art.src = game.coverUrl || ''
  if (playBtn) playBtn.dataset.gameId = game.gameId
  if (favBtn) {
    favBtn.dataset.favorite = game.gameId
    const isFav = isFavorite(game.gameId)
    favBtn.classList.toggle('active', isFav)
    favBtn.querySelector('svg')?.setAttribute('fill', isFav ? 'currentColor' : 'none')
  }

  hero.style.setProperty('--accent-color', getSystemColor(game.systemId))
}

function getGameDescription(game) {
  const descs = {
    nes: 'Classic 8-bit Nintendo Entertainment System game.',
    snes: 'Super Nintendo 16-bit classic.',
    gb: 'Original Game Boy title.',
    gbc: 'Game Boy Color adventure.',
    gba: 'Game Boy Advance portable classic.',
    nds: 'Nintendo DS dual-screen experience.',
    n64: 'Nintendo 64 3D classic.',
    segaMD: 'Sega Genesis blast processing.',
    segaMS: 'Sega Master System gem.',
    segaGG: 'Sega Game Gear portable.',
    psx: 'PlayStation classic.',
    arcade: 'Arcade action.'
  }
  return descs[game.systemId] || 'Ready to play!'
}

function getSystemColor(systemId) {
  const colors = {
    nes: '#e60012', snes: '#7b5aa6', gb: '#8b956d', gbc: '#4ecdc4',
    gba: '#5a5eb9', nds: '#a0a0a0', n64: '#339947', segaMD: '#17569b',
    segaMS: '#e60012', segaGG: '#1976d2', psx: '#003087', arcade: '#ff9800'
  }
  return colors[systemId] || '#666'
}

function getSystemIcon(systemId) {
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="8" cy="12" r="2"/>
    <circle cx="17" cy="10" r="1.5"/>
    <circle cx="17" cy="14" r="1.5"/>
  </svg>`
}

export function cleanupWebrcadeView() {
  document.removeEventListener('keydown', handleKeyNav)
}

export function refreshWebrcadeView() {
  recentGames = loadRecentGames()
  const container = document.getElementById('webrcade-view')
  if (container) renderCurrentView(container)
}
