import { comments, ratings, favorites } from '../lib/supabase.js'
import { store } from '../lib/store.js'

// Render game info panel (shown alongside emulator)
export function renderGamePanel(gameId, gameName, systemId) {
  const existing = document.getElementById('game-panel')
  if (existing) existing.remove()

  const panel = document.createElement('div')
  panel.id = 'game-panel'
  panel.className = 'game-panel'
  panel.innerHTML = `
    <div class="panel-header">
      <h3>${gameName}</h3>
      <span class="panel-system">${systemId.toUpperCase()}</span>
    </div>

    <div class="panel-actions">
      <button class="panel-btn" id="favorite-btn" title="Add to favorites">
        <span id="favorite-icon">🤍</span>
      </button>
      <button class="panel-btn" id="screenshot-btn" title="Take screenshot">📸</button>
      <button class="panel-btn" id="panel-close" title="Close panel">✕</button>
    </div>

    <div class="panel-section">
      <h4>Your Rating</h4>
      <div class="rating-stars" id="rating-stars">
        ${[1, 2, 3, 4, 5].map(n => `<span class="star" data-rating="${n}">☆</span>`).join('')}
      </div>
    </div>

    <div class="panel-section">
      <h4>Community Rating</h4>
      <div class="community-rating" id="community-rating">
        <span class="rating-value">-</span>
        <span class="rating-count">(0 ratings)</span>
      </div>
    </div>

    <div class="panel-section">
      <h4>Comments</h4>
      <div id="comments-section">
        <div id="comments-list" class="comments-list">
          <p class="loading-text">Loading comments...</p>
        </div>
        <div id="comment-form-container"></div>
      </div>
    </div>
  `

  document.body.appendChild(panel)

  // Setup event listeners
  setupPanelEvents(gameId, gameName, systemId)

  // Load data
  loadGamePanelData(gameId)
}

function setupPanelEvents(gameId, gameName, systemId) {
  const { user } = store.getState()

  // Close panel
  document.getElementById('panel-close').addEventListener('click', () => {
    document.getElementById('game-panel')?.remove()
  })

  // Favorite button
  document.getElementById('favorite-btn').addEventListener('click', async () => {
    if (!user) {
      showToast('Sign in to add favorites', 'error')
      return
    }

    const icon = document.getElementById('favorite-icon')
    const isFav = icon.textContent === '❤️'

    try {
      if (isFav) {
        await favorites.remove(user.id, gameId)
        icon.textContent = '🤍'
        showToast('Removed from favorites', 'success')
      } else {
        await favorites.add(user.id, gameId, gameName, systemId)
        icon.textContent = '❤️'
        showToast('Added to favorites!', 'success')
      }
    } catch (error) {
      showToast('Failed to update favorites', 'error')
    }
  })

  // Rating stars
  const starsContainer = document.getElementById('rating-stars')
  starsContainer.addEventListener('click', async (e) => {
    if (!user) {
      showToast('Sign in to rate games', 'error')
      return
    }

    const star = e.target.closest('.star')
    if (!star) return

    const rating = parseInt(star.dataset.rating)

    try {
      await ratings.set(user.id, gameId, rating)
      updateStars(rating)
      showToast(`Rated ${rating} stars!`, 'success')
      loadCommunityRating(gameId)
    } catch (error) {
      showToast('Failed to save rating', 'error')
    }
  })

  // Hover effect on stars
  starsContainer.addEventListener('mouseover', (e) => {
    const star = e.target.closest('.star')
    if (!star) return
    const rating = parseInt(star.dataset.rating)
    highlightStars(rating)
  })

  starsContainer.addEventListener('mouseout', () => {
    // Reset to actual rating
    const currentRating = parseInt(starsContainer.dataset.currentRating) || 0
    updateStars(currentRating)
  })

  // Screenshot button
  document.getElementById('screenshot-btn').addEventListener('click', () => {
    takeScreenshot()
  })
}

async function loadGamePanelData(gameId) {
  const { user } = store.getState()

  // Load comments
  await loadComments(gameId)

  // Load community rating
  await loadCommunityRating(gameId)

  // Load user-specific data
  if (user) {
    // Load user rating
    try {
      const userRating = await ratings.getUserRating(user.id, gameId)
      if (userRating) {
        updateStars(userRating)
        document.getElementById('rating-stars').dataset.currentRating = userRating
      }
    } catch (e) {
      console.error('Error loading user rating:', e)
    }

    // Check if favorite
    try {
      const isFav = await favorites.isFavorite(user.id, gameId)
      document.getElementById('favorite-icon').textContent = isFav ? '❤️' : '🤍'
    } catch (e) {
      console.error('Error checking favorite:', e)
    }

    // Show comment form
    renderCommentForm(gameId)
  }
}

async function loadComments(gameId) {
  const commentsList = document.getElementById('comments-list')

  try {
    const gameComments = await comments.list(gameId)

    if (gameComments.length === 0) {
      commentsList.innerHTML = '<p class="empty-text">No comments yet. Be the first!</p>'
      return
    }

    commentsList.innerHTML = gameComments.map(comment => `
      <div class="comment" data-id="${comment.id}">
        <div class="comment-header">
          <img src="${comment.profiles?.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + comment.profiles?.username}" alt="" class="comment-avatar">
          <span class="comment-author">${comment.profiles?.username || 'Anonymous'}</span>
          <span class="comment-date">${formatDate(comment.created_at)}</span>
        </div>
        <div class="comment-content">${escapeHtml(comment.content)}</div>
      </div>
    `).join('')
  } catch (error) {
    commentsList.innerHTML = '<p class="error-text">Failed to load comments</p>'
  }
}

async function loadCommunityRating(gameId) {
  try {
    const rating = await ratings.get(gameId)
    const container = document.getElementById('community-rating')

    if (rating.count > 0) {
      container.innerHTML = `
        <span class="rating-value">${rating.average.toFixed(1)} ⭐</span>
        <span class="rating-count">(${rating.count} rating${rating.count !== 1 ? 's' : ''})</span>
      `
    } else {
      container.innerHTML = `
        <span class="rating-value">No ratings yet</span>
      `
    }
  } catch (error) {
    console.error('Error loading community rating:', error)
  }
}

function renderCommentForm(gameId) {
  const container = document.getElementById('comment-form-container')
  container.innerHTML = `
    <form id="comment-form" class="comment-form">
      <textarea id="comment-input" placeholder="Write a comment..." rows="2" maxlength="500"></textarea>
      <button type="submit" class="btn btn-primary btn-small">Post</button>
    </form>
  `

  document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    await submitComment(gameId)
  })
}

async function submitComment(gameId) {
  const { user } = store.getState()
  if (!user) return

  const input = document.getElementById('comment-input')
  const content = input.value.trim()

  if (!content) return

  try {
    await comments.add(user.id, gameId, content)
    input.value = ''
    showToast('Comment posted!', 'success')
    await loadComments(gameId)
  } catch (error) {
    showToast('Failed to post comment', 'error')
  }
}

function updateStars(rating) {
  const stars = document.querySelectorAll('#rating-stars .star')
  stars.forEach((star, index) => {
    star.textContent = index < rating ? '★' : '☆'
    star.classList.toggle('filled', index < rating)
  })
}

function highlightStars(rating) {
  const stars = document.querySelectorAll('#rating-stars .star')
  stars.forEach((star, index) => {
    star.textContent = index < rating ? '★' : '☆'
  })
}

function takeScreenshot() {
  // Try to get canvas from EmulatorJS
  const canvas = document.querySelector('#game canvas')
  if (!canvas) {
    showToast('Could not capture screenshot', 'error')
    return
  }

  try {
    const link = document.createElement('a')
    link.download = `screenshot-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast('Screenshot saved!', 'success')
  } catch (error) {
    showToast('Failed to save screenshot', 'error')
  }
}

// Utility functions
function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => toast.remove(), 3000)
}

// Close panel
export function closeGamePanel() {
  document.getElementById('game-panel')?.remove()
}
