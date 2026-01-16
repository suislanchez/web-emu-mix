// webЯcade-style View Component
// Netflix/TV-style interface with hero section and horizontal carousels

import { toggleFavorite, isFavorite } from '../lib/library.js'
import { loadRecentGames, deleteGameById } from '../lib/store.js'

let selectedGameIndex = 0
let selectedCategoryIndex = 0
let categories = []
let featuredGame = null
let onPlayGame = null

export function renderWebrcadeView(container, playGameCallback) {
  onPlayGame = playGameCallback
  const recentGames = loadRecentGames()

  // Group games by system
  const gamesBySystem = {}
  recentGames.forEach(game => {
    const system = game.systemName || game.systemId || 'Other'
    if (!gamesBySystem[system]) {
      gamesBySystem[system] = []
    }
    gamesBySystem[system].push(game)
  })

  // Create categories array
  categories = Object.entries(gamesBySystem).map(([system, games]) => ({
    name: `${system} Games`,
    systemId: games[0]?.systemId,
    games
  }))

  // Add "All Games" category at the top if there are games
  if (recentGames.length > 0) {
    categories.unshift({
      name: 'Recently Played',
      systemId: null,
      games: recentGames.slice(0, 20)
    })
  }

  // Set featured game (first game or first in selected category)
  featuredGame = recentGames[0] || null

  container.innerHTML = `
    <div class="webrcade-container">
      ${renderHeroSection(featuredGame)}
      <div class="webrcade-categories" id="webrcade-categories">
        ${categories.length > 0 ? categories.map((cat, catIndex) => renderCategory(cat, catIndex)).join('') : renderEmptyState()}
      </div>
    </div>
  `

  setupWebrcadeEvents(container)

  // Select first game if available
  if (categories.length > 0 && categories[0].games.length > 0) {
    selectGame(0, 0)
  }
}

function renderHeroSection(game) {
  if (!game) {
    return `
      <div class="webrcade-hero webrcade-hero-empty">
        <div class="hero-content">
          <h1 class="hero-title">Welcome to PixelVault</h1>
          <p class="hero-system">Your Retro Gaming Hub</p>
          <p class="hero-description">Upload ROMs or browse the game catalog to get started. Drag & drop a ROM file or click the upload button below.</p>
          <div class="hero-actions">
            <button class="hero-play-btn" id="hero-upload-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload ROM
            </button>
            <button class="hero-secondary-btn" id="hero-browse-btn">Browse Catalog</button>
          </div>
        </div>
        <div class="hero-backdrop-empty"></div>
      </div>
    `
  }

  const systemColor = getSystemColor(game.systemId)

  return `
    <div class="webrcade-hero" style="--system-color: ${systemColor}">
      <div class="hero-backdrop" id="hero-backdrop">
        <img src="${game.coverUrl || ''}" alt="" class="hero-backdrop-img" onerror="this.style.display='none'" />
        <div class="hero-backdrop-gradient"></div>
      </div>
      <div class="hero-content">
        <h1 class="hero-title" id="hero-title">${game.name}</h1>
        <p class="hero-system" id="hero-system">${game.systemName || game.systemId}</p>
        <p class="hero-description" id="hero-description">${game.description || getDefaultDescription(game)}</p>
        <div class="hero-actions">
          <button class="hero-play-btn" id="hero-play-btn" data-game-id="${game.gameId}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            PLAY
          </button>
          <button class="hero-secondary-btn hero-favorite-btn ${isFavorite(game.gameId) ? 'active' : ''}" id="hero-favorite-btn" data-game-id="${game.gameId}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite(game.gameId) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button class="hero-secondary-btn" id="hero-delete-btn" data-game-id="${game.gameId}" title="Delete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="hero-screenshot" id="hero-screenshot">
        <img src="${game.coverUrl || ''}" alt="${game.name}" onerror="this.parentElement.classList.add('no-image')" />
      </div>
    </div>
  `
}

function renderCategory(category, catIndex) {
  return `
    <div class="webrcade-category" data-category="${catIndex}">
      <div class="category-header">
        <h3 class="category-title">${category.name}</h3>
        <span class="category-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
      </div>
      <div class="category-carousel-wrapper">
        <button class="carousel-nav carousel-nav-left" data-category="${catIndex}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div class="category-carousel" data-category="${catIndex}">
          ${category.games.map((game, gameIndex) => renderGameCard(game, catIndex, gameIndex)).join('')}
        </div>
        <button class="carousel-nav carousel-nav-right" data-category="${catIndex}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  `
}

function renderGameCard(game, catIndex, gameIndex) {
  const systemColor = getSystemColor(game.systemId)
  const isSelected = catIndex === selectedCategoryIndex && gameIndex === selectedGameIndex

  return `
    <div class="webrcade-game-card ${isSelected ? 'selected' : ''}"
         data-category="${catIndex}"
         data-index="${gameIndex}"
         data-game-id="${game.gameId}"
         style="--system-color: ${systemColor}">
      <div class="game-card-cover">
        ${game.coverUrl
          ? `<img src="${game.coverUrl}" alt="${game.name}" loading="lazy" onerror="this.parentElement.classList.add('no-cover')" />`
          : `<div class="game-card-placeholder">${game.icon || getSystemIcon(game.systemId)}</div>`
        }
      </div>
      <div class="game-card-title">${game.name}</div>
    </div>
  `
}

function renderEmptyState() {
  return `
    <div class="webrcade-empty">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <circle cx="8" cy="12" r="2"/>
          <line x1="15" y1="10" x2="19" y2="10"/>
          <line x1="15" y1="14" x2="19" y2="14"/>
        </svg>
      </div>
      <h3>No Games Yet</h3>
      <p>Upload a ROM or browse the catalog to add games to your library</p>
    </div>
  `
}

function setupWebrcadeEvents(container) {
  // Play button
  const playBtn = document.getElementById('hero-play-btn')
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (featuredGame && onPlayGame) {
        onPlayGame(featuredGame)
      }
    })
  }

  // Upload button (empty state)
  const uploadBtn = document.getElementById('hero-upload-btn')
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      document.getElementById('rom-input')?.click()
    })
  }

  // Browse button
  const browseBtn = document.getElementById('hero-browse-btn')
  if (browseBtn) {
    browseBtn.addEventListener('click', () => {
      document.getElementById('browse-games-btn')?.click()
    })
  }

  // Favorite button
  const favoriteBtn = document.getElementById('hero-favorite-btn')
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => {
      const gameId = favoriteBtn.dataset.gameId
      toggleFavorite(gameId)
      favoriteBtn.classList.toggle('active')
      const svg = favoriteBtn.querySelector('svg')
      svg.setAttribute('fill', favoriteBtn.classList.contains('active') ? 'currentColor' : 'none')
    })
  }

  // Delete button
  const deleteBtn = document.getElementById('hero-delete-btn')
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const gameId = deleteBtn.dataset.gameId
      if (confirm('Remove this game from your library?')) {
        deleteGameById(gameId)
        renderWebrcadeView(container, onPlayGame)
      }
    })
  }

  // Game card clicks
  container.querySelectorAll('.webrcade-game-card').forEach(card => {
    card.addEventListener('click', () => {
      const catIndex = parseInt(card.dataset.category)
      const gameIndex = parseInt(card.dataset.index)
      selectGame(catIndex, gameIndex)
    })

    card.addEventListener('dblclick', () => {
      const catIndex = parseInt(card.dataset.category)
      const gameIndex = parseInt(card.dataset.index)
      const game = categories[catIndex]?.games[gameIndex]
      if (game && onPlayGame) {
        onPlayGame(game)
      }
    })
  })

  // Carousel navigation
  container.querySelectorAll('.carousel-nav-left').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const catIndex = parseInt(btn.dataset.category)
      scrollCarousel(catIndex, -1)
    })
  })

  container.querySelectorAll('.carousel-nav-right').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const catIndex = parseInt(btn.dataset.category)
      scrollCarousel(catIndex, 1)
    })
  })

  // Keyboard navigation
  document.addEventListener('keydown', handleKeyNavigation)
}

function handleKeyNavigation(e) {
  if (!categories.length) return

  const currentCategory = categories[selectedCategoryIndex]
  if (!currentCategory) return

  switch(e.key) {
    case 'ArrowRight':
      e.preventDefault()
      if (selectedGameIndex < currentCategory.games.length - 1) {
        selectGame(selectedCategoryIndex, selectedGameIndex + 1)
      }
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (selectedGameIndex > 0) {
        selectGame(selectedCategoryIndex, selectedGameIndex - 1)
      }
      break
    case 'ArrowDown':
      e.preventDefault()
      if (selectedCategoryIndex < categories.length - 1) {
        const nextCategory = categories[selectedCategoryIndex + 1]
        const nextIndex = Math.min(selectedGameIndex, nextCategory.games.length - 1)
        selectGame(selectedCategoryIndex + 1, nextIndex)
      }
      break
    case 'ArrowUp':
      e.preventDefault()
      if (selectedCategoryIndex > 0) {
        const prevCategory = categories[selectedCategoryIndex - 1]
        const prevIndex = Math.min(selectedGameIndex, prevCategory.games.length - 1)
        selectGame(selectedCategoryIndex - 1, prevIndex)
      }
      break
    case 'Enter':
      e.preventDefault()
      if (featuredGame && onPlayGame) {
        onPlayGame(featuredGame)
      }
      break
  }
}

function selectGame(catIndex, gameIndex) {
  // Remove previous selection
  document.querySelectorAll('.webrcade-game-card.selected').forEach(card => {
    card.classList.remove('selected')
  })

  // Update selection state
  selectedCategoryIndex = catIndex
  selectedGameIndex = gameIndex

  // Add selection to new card
  const card = document.querySelector(`.webrcade-game-card[data-category="${catIndex}"][data-index="${gameIndex}"]`)
  if (card) {
    card.classList.add('selected')
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  // Update featured game
  const game = categories[catIndex]?.games[gameIndex]
  if (game) {
    featuredGame = game
    updateHeroSection(game)
  }
}

function updateHeroSection(game) {
  const title = document.getElementById('hero-title')
  const system = document.getElementById('hero-system')
  const description = document.getElementById('hero-description')
  const backdrop = document.getElementById('hero-backdrop')
  const screenshot = document.getElementById('hero-screenshot')
  const playBtn = document.getElementById('hero-play-btn')
  const favoriteBtn = document.getElementById('hero-favorite-btn')
  const deleteBtn = document.getElementById('hero-delete-btn')

  if (title) title.textContent = game.name
  if (system) system.textContent = game.systemName || game.systemId
  if (description) description.textContent = game.description || getDefaultDescription(game)

  if (backdrop) {
    const img = backdrop.querySelector('.hero-backdrop-img')
    if (img) {
      img.src = game.coverUrl || ''
      img.style.display = game.coverUrl ? 'block' : 'none'
    }
    backdrop.parentElement.style.setProperty('--system-color', getSystemColor(game.systemId))
  }

  if (screenshot) {
    const img = screenshot.querySelector('img')
    if (img) {
      img.src = game.coverUrl || ''
      img.alt = game.name
    }
    screenshot.classList.toggle('no-image', !game.coverUrl)
  }

  if (playBtn) playBtn.dataset.gameId = game.gameId
  if (deleteBtn) deleteBtn.dataset.gameId = game.gameId

  if (favoriteBtn) {
    favoriteBtn.dataset.gameId = game.gameId
    const isFav = isFavorite(game.gameId)
    favoriteBtn.classList.toggle('active', isFav)
    const svg = favoriteBtn.querySelector('svg')
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none')
  }
}

function scrollCarousel(catIndex, direction) {
  const carousel = document.querySelector(`.category-carousel[data-category="${catIndex}"]`)
  if (carousel) {
    const cardWidth = 180 // Card width + gap
    carousel.scrollBy({ left: direction * cardWidth * 3, behavior: 'smooth' })
  }
}

function getDefaultDescription(game) {
  const descriptions = {
    nes: 'A classic 8-bit Nintendo Entertainment System game.',
    snes: 'A legendary Super Nintendo game from the 16-bit era.',
    gba: 'A portable masterpiece from the Game Boy Advance library.',
    gbc: 'A colorful Game Boy Color adventure.',
    gb: 'A timeless Game Boy classic.',
    n64: 'An iconic Nintendo 64 experience.',
    nds: 'A dual-screen Nintendo DS adventure.',
    psx: 'A PlayStation classic from the 32-bit generation.',
    genesis: 'A Sega Genesis blast from the past.',
    sms: 'A Sega Master System gem.',
    arcade: 'An arcade classic ready to play.'
  }
  return descriptions[game.systemId] || 'Ready to play!'
}

function getSystemColor(systemId) {
  const colors = {
    nes: '#e60012',
    snes: '#7b5aa6',
    gb: '#8b956d',
    gbc: '#4ecdc4',
    gba: '#5a5eb9',
    nds: '#cccccc',
    n64: '#339947',
    psx: '#003087',
    genesis: '#17569b',
    sms: '#e60012',
    arcade: '#ff9800'
  }
  return colors[systemId] || '#e94560'
}

function getSystemIcon(systemId) {
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="8" cy="12" r="2"/>
    <circle cx="17" cy="10" r="1"/>
    <circle cx="17" cy="14" r="1"/>
    <circle cx="15" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
  </svg>`
}

export function cleanupWebrcadeView() {
  document.removeEventListener('keydown', handleKeyNavigation)
}
