// Game Browser Component
// Browse and search the game catalog

import { store } from '../lib/store.js'
import { searchCatalog, getGenres, getMyrientUrl, SYSTEM_INFO } from '../lib/gameCatalog.js'
import { library } from '../lib/supabase.js'

let currentFilters = {
  system: null,
  genre: null,
  region: null,
  query: ''
}

let currentPage = 0
let currentSort = 'title'
let currentSortAsc = true
const PAGE_SIZE = 48

// Available systems for filtering
const SYSTEMS = ['nes', 'snes', 'gb', 'gbc', 'gba', 'nds', 'n64', 'segaMD', 'segaMS', 'segaGG', 'psx']
const REGIONS = ['USA', 'Europe', 'Japan', 'World']

export async function renderGameBrowser(initialSystem = null, initialQuery = null, initialGenre = null) {
  // Apply initial filters if provided
  if (initialSystem) currentFilters.system = initialSystem
  if (initialQuery) currentFilters.query = initialQuery
  if (initialGenre) currentFilters.genre = initialGenre

  // Reset page when opening with new filters
  currentPage = 0

  const mainContent = document.querySelector('.main-content') || document.getElementById('app')
  if (!mainContent) return

  // Hide other views
  document.querySelectorAll('.library-view, .emulator-view, .system-selector, .upload-area, .recent-games, #library-manager').forEach(el => {
    if (el) el.style.display = 'none'
  })

  // Check if browser already exists
  let browser = document.getElementById('game-browser')
  if (!browser) {
    browser = document.createElement('div')
    browser.id = 'game-browser'
    browser.className = 'game-browser'
    mainContent.appendChild(browser)
  }

  browser.style.display = 'block'
  browser.innerHTML = `
    <div class="browser-header">
      <button class="btn btn-outline back-btn" id="browser-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      <h1>Browse Games</h1>
      <div class="browser-header-actions">
        <button class="btn btn-outline" id="my-library-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          My Library
        </button>
      </div>
    </div>

    <div class="browser-layout">
      <aside class="browser-filters">
        <div class="filter-section">
          <h4>Search</h4>
          <div class="search-input-wrapper">
            <input type="text" id="game-search-input" placeholder="Search games..." class="search-input" value="${escapeHtml(currentFilters.query)}">
            <button id="search-btn" class="search-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="filter-section">
          <h4>System</h4>
          <div class="filter-chips" id="system-filters">
            ${SYSTEMS.map(sys => `
              <button class="filter-chip ${currentFilters.system === sys ? 'active' : ''}" data-system="${sys}">
                ${SYSTEM_INFO[sys]?.name || sys.toUpperCase()}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="filter-section">
          <h4>Region</h4>
          <div class="filter-chips" id="region-filters">
            ${REGIONS.map(region => `
              <button class="filter-chip ${currentFilters.region === region ? 'active' : ''}" data-region="${region}">
                ${region}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="filter-section" id="genre-filter-section">
          <h4>Genre</h4>
          <div class="filter-chips" id="genre-filters">
            <span class="loading-text">Loading genres...</span>
          </div>
        </div>

        <button class="btn btn-outline btn-block" id="clear-filters">Clear All Filters</button>
      </aside>

      <main class="browser-results">
        <div class="results-header">
          <span id="results-count">Loading...</span>
          <div class="sort-options">
            <select id="sort-select" class="setting-select">
              <option value="title_asc" ${currentSort === 'title' && currentSortAsc ? 'selected' : ''}>Title A-Z</option>
              <option value="title_desc" ${currentSort === 'title' && !currentSortAsc ? 'selected' : ''}>Title Z-A</option>
              <option value="release_date_asc" ${currentSort === 'release_date' && currentSortAsc ? 'selected' : ''}>Release Date (Old)</option>
              <option value="release_date_desc" ${currentSort === 'release_date' && !currentSortAsc ? 'selected' : ''}>Release Date (New)</option>
              <option value="rating_desc" ${currentSort === 'rating' && !currentSortAsc ? 'selected' : ''}>Highest Rated</option>
            </select>
          </div>
        </div>

        <div class="results-grid" id="results-grid">
          <div class="loading-text">Loading games...</div>
        </div>

        <div class="pagination" id="pagination"></div>
      </main>
    </div>
  `

  setupBrowserEvents()
  loadGenres()
  loadGames()
}

function setupBrowserEvents() {
  // Back button
  document.getElementById('browser-back')?.addEventListener('click', closeBrowser)

  // My Library button
  document.getElementById('my-library-btn')?.addEventListener('click', () => {
    import('./libraryManager.js').then(m => m.renderLibraryManager())
  })

  // Search
  const searchInput = document.getElementById('game-search-input')
  const searchBtn = document.getElementById('search-btn')

  searchBtn?.addEventListener('click', () => {
    currentFilters.query = searchInput?.value || ''
    currentPage = 0
    loadGames()
  })

  searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentFilters.query = searchInput.value
      currentPage = 0
      loadGames()
    }
  })

  // System filters
  document.getElementById('system-filters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip')
    if (!chip) return

    const system = chip.dataset.system
    const isActive = chip.classList.contains('active')

    document.querySelectorAll('#system-filters .filter-chip').forEach(c => c.classList.remove('active'))

    if (!isActive) {
      chip.classList.add('active')
      currentFilters.system = system
    } else {
      currentFilters.system = null
    }

    currentPage = 0
    loadGames()
  })

  // Region filters
  document.getElementById('region-filters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip')
    if (!chip) return

    const region = chip.dataset.region
    const isActive = chip.classList.contains('active')

    document.querySelectorAll('#region-filters .filter-chip').forEach(c => c.classList.remove('active'))

    if (!isActive) {
      chip.classList.add('active')
      currentFilters.region = region
    } else {
      currentFilters.region = null
    }

    currentPage = 0
    loadGames()
  })

  // Genre filters
  document.getElementById('genre-filters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip')
    if (!chip) return

    const genre = chip.dataset.genre
    const isActive = chip.classList.contains('active')

    document.querySelectorAll('#genre-filters .filter-chip').forEach(c => c.classList.remove('active'))

    if (!isActive) {
      chip.classList.add('active')
      currentFilters.genre = genre
    } else {
      currentFilters.genre = null
    }

    currentPage = 0
    loadGames()
  })

  // Clear filters
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    currentFilters = { system: null, genre: null, region: null, query: '' }
    document.getElementById('game-search-input').value = ''
    document.querySelectorAll('.filter-chip.active').forEach(c => c.classList.remove('active'))
    currentPage = 0
    loadGames()
  })

  // Sort
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    const [sort, dir] = e.target.value.split('_')
    currentSort = sort
    currentSortAsc = dir === 'asc'
    currentPage = 0
    loadGames()
  })

  // Results grid - game actions
  document.getElementById('results-grid')?.addEventListener('click', handleGameAction)

  // Pagination
  document.getElementById('pagination')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.page-btn')
    if (!btn) return

    const page = parseInt(btn.dataset.page)
    if (!isNaN(page) && page !== currentPage) {
      currentPage = page
      loadGames()
      // Scroll to top of results
      document.getElementById('results-grid')?.scrollIntoView({ behavior: 'smooth' })
    }
  })
}

async function loadGenres() {
  const genresContainer = document.getElementById('genre-filters')
  if (!genresContainer) return

  const genres = await getGenres()

  if (genres.length === 0) {
    genresContainer.innerHTML = '<span class="empty-text">No genres available</span>'
    return
  }

  // Show top 15 genres
  const topGenres = genres.slice(0, 15)

  genresContainer.innerHTML = topGenres.map(g => `
    <button class="filter-chip ${currentFilters.genre === g.genre ? 'active' : ''}" data-genre="${escapeHtml(g.genre)}">
      ${escapeHtml(g.genre)}
    </button>
  `).join('')
}

async function loadGames() {
  const grid = document.getElementById('results-grid')
  if (!grid) return

  grid.innerHTML = '<div class="loading-text">Loading games...</div>'

  try {
    const { games, total } = await searchCatalog({
      query: currentFilters.query,
      system: currentFilters.system,
      genre: currentFilters.genre,
      region: currentFilters.region,
      sortBy: currentSort,
      sortAsc: currentSortAsc,
      page: currentPage,
      pageSize: PAGE_SIZE
    })

    // Update count
    document.getElementById('results-count').textContent = `${total.toLocaleString()} games found`

    if (games.length === 0) {
      grid.innerHTML = `
        <div class="empty-results">
          <div class="empty-icon">🔍</div>
          <h3>No games found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      `
      document.getElementById('pagination').innerHTML = ''
      return
    }

    // Get library status for logged in user
    const { user } = store.getState()
    let libraryStatus = {}

    if (user) {
      const gameIds = games.map(g => g.id)
      libraryStatus = await library.getStatusBatch(user.id, gameIds)
    }

    // Render games
    grid.innerHTML = games.map(game => renderGameCard(game, libraryStatus[game.id])).join('')

    // Render pagination
    renderPagination(total)

  } catch (err) {
    console.error('Load games error:', err)
    grid.innerHTML = '<div class="error-text">Failed to load games. Please try again.</div>'
  }
}

function renderGameCard(game, libraryEntry) {
  const systemInfo = SYSTEM_INFO[game.system_id] || { name: game.system_id, color: '#666' }
  const isInLibrary = !!libraryEntry
  const isReady = libraryEntry?.download_status === 'completed'

  return `
    <div class="catalog-card" data-game-id="${game.id}" data-myrient-path="${escapeHtml(game.myrient_path)}">
      <div class="catalog-cover" style="--system-color: ${systemInfo.color}">
        ${game.cover_url
          ? `<img src="${game.cover_url}" alt="${escapeHtml(game.title)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
          : ''
        }
        <div class="catalog-cover-placeholder" ${game.cover_url ? 'style="display:none"' : ''}>
          <span class="system-icon">${systemInfo.icon}</span>
          <span class="system-label">${systemInfo.name}</span>
        </div>
        ${isInLibrary ? '<div class="library-badge">In Library</div>' : ''}
      </div>
      <div class="catalog-info">
        <h3 class="catalog-title" title="${escapeHtml(game.title)}">${escapeHtml(game.title)}</h3>
        <div class="catalog-meta">
          <span class="system-badge" style="background: ${systemInfo.color}">${systemInfo.name}</span>
          ${game.region ? `<span class="region-badge">${game.region}</span>` : ''}
        </div>
        ${game.genres?.length ? `<div class="catalog-genres">${game.genres.slice(0, 2).join(', ')}</div>` : ''}
        ${game.igdb_rating ? `
          <div class="catalog-rating">
            <span class="rating-star">★</span>
            <span>${(game.igdb_rating / 20).toFixed(1)}</span>
          </div>
        ` : ''}
      </div>
      <div class="catalog-actions">
        ${isReady
          ? `<button class="btn btn-sm btn-primary play-btn">Play Now</button>`
          : isInLibrary
            ? `<button class="btn btn-sm btn-outline" disabled>In Library</button>`
            : `<button class="btn btn-sm btn-primary add-btn">Add to Library</button>`
        }
        <button class="btn btn-sm btn-outline download-link-btn" title="Direct Download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </div>
    </div>
  `
}

function renderPagination(total) {
  const pagination = document.getElementById('pagination')
  if (!pagination) return

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (totalPages <= 1) {
    pagination.innerHTML = ''
    return
  }

  let buttons = []

  // Previous button
  if (currentPage > 0) {
    buttons.push(`<button class="page-btn" data-page="${currentPage - 1}">← Prev</button>`)
  }

  // Page numbers
  const maxVisible = 5
  let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1)

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(0, endPage - maxVisible + 1)
  }

  if (startPage > 0) {
    buttons.push(`<button class="page-btn" data-page="0">1</button>`)
    if (startPage > 1) {
      buttons.push(`<span class="page-ellipsis">...</span>`)
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    buttons.push(`
      <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
        ${i + 1}
      </button>
    `)
  }

  if (endPage < totalPages - 1) {
    if (endPage < totalPages - 2) {
      buttons.push(`<span class="page-ellipsis">...</span>`)
    }
    buttons.push(`<button class="page-btn" data-page="${totalPages - 1}">${totalPages}</button>`)
  }

  // Next button
  if (currentPage < totalPages - 1) {
    buttons.push(`<button class="page-btn" data-page="${currentPage + 1}">Next →</button>`)
  }

  pagination.innerHTML = buttons.join('')
}

async function handleGameAction(e) {
  const card = e.target.closest('.catalog-card')
  if (!card) return

  const gameId = card.dataset.gameId
  const myrientPath = card.dataset.myrientPath

  // Add to library
  if (e.target.closest('.add-btn')) {
    const { user } = store.getState()
    if (!user) {
      showToast('Please sign in to add games to your library', 'error')
      return
    }

    const btn = e.target.closest('.add-btn')
    btn.disabled = true
    btn.textContent = 'Adding...'

    try {
      await library.add(user.id, gameId, 'external')
      btn.textContent = 'In Library'
      card.querySelector('.catalog-cover')?.insertAdjacentHTML('beforeend', '<div class="library-badge">In Library</div>')
      showToast('Added to library!', 'success')
    } catch (err) {
      console.error('Add to library error:', err)
      btn.disabled = false
      btn.textContent = 'Add to Library'
      showToast('Failed to add to library', 'error')
    }
    return
  }

  // Direct download link
  if (e.target.closest('.download-link-btn')) {
    const url = getMyrientUrl(myrientPath)
    window.open(url, '_blank')
    return
  }

  // Play (if in library and ready)
  if (e.target.closest('.play-btn')) {
    // TODO: Implement play from library
    showToast('Loading game...', 'info')
    return
  }
}

function closeBrowser() {
  const browser = document.getElementById('game-browser')
  if (browser) {
    browser.style.display = 'none'
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

// Export for use in main.js
export { closeBrowser }
