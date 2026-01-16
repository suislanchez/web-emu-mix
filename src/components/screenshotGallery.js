// Screenshot Gallery Modal
import { getScreenshots, deleteScreenshot } from '../lib/library.js'

export function renderScreenshotGallery(gameId = null) {
  closeScreenshotGallery()

  const screenshots = getScreenshots(gameId)
  const modal = document.createElement('div')
  modal.id = 'gallery-modal'
  modal.className = 'modal-overlay'

  modal.innerHTML = `
    <div class="modal modal-large">
      <button class="modal-close" id="gallery-close">&times;</button>
      <div class="gallery-content">
        <div class="gallery-header">
          <h2>Screenshot Gallery</h2>
          <span class="gallery-count">${screenshots.length} screenshots</span>
        </div>

        ${screenshots.length === 0 ? `
          <div class="gallery-empty">
            <div class="gallery-empty-icon">&#128247;</div>
            <p>No screenshots yet</p>
            <p class="gallery-hint">Press F12 during gameplay to capture screenshots</p>
          </div>
        ` : `
          <div class="gallery-grid">
            ${screenshots.map(ss => `
              <div class="gallery-item" data-id="${ss.id}">
                <img src="${ss.dataUrl}" alt="${ss.gameName}" loading="lazy" />
                <div class="gallery-item-overlay">
                  <div class="gallery-item-info">
                    <span class="gallery-item-game">${ss.gameName}</span>
                    <span class="gallery-item-date">${formatDate(ss.timestamp)}</span>
                  </div>
                  <div class="gallery-item-actions">
                    <button class="gallery-btn download-btn" title="Download">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    <button class="gallery-btn delete-btn" title="Delete">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Trigger reflow and add show class for animation
  requestAnimationFrame(() => {
    modal.classList.add('show')
  })

  setupGalleryEvents()
}

function setupGalleryEvents() {
  document.getElementById('gallery-close').addEventListener('click', closeScreenshotGallery)
  document.getElementById('gallery-modal').addEventListener('click', (e) => {
    if (e.target.id === 'gallery-modal') closeScreenshotGallery()
  })

  // Download buttons
  document.querySelectorAll('.gallery-item .download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const item = btn.closest('.gallery-item')
      const img = item.querySelector('img')
      const gameName = item.querySelector('.gallery-item-game').textContent

      const a = document.createElement('a')
      a.href = img.src
      a.download = `${gameName.replace(/[^a-z0-9]/gi, '_')}_screenshot.png`
      a.click()
    })
  })

  // Delete buttons
  document.querySelectorAll('.gallery-item .delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const item = btn.closest('.gallery-item')
      const id = item.dataset.id

      if (confirm('Delete this screenshot?')) {
        deleteScreenshot(id)
        item.remove()
        updateScreenshotCount()
      }
    })
  })

  // Click to view full size
  document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('click', () => {
      showFullscreenImage(img.src, img.alt)
    })
  })
}

function showFullscreenImage(src, alt) {
  const viewer = document.createElement('div')
  viewer.className = 'image-viewer'
  viewer.innerHTML = `
    <div class="image-viewer-backdrop"></div>
    <img src="${src}" alt="${alt}" />
    <button class="image-viewer-close">&times;</button>
  `

  document.body.appendChild(viewer)

  viewer.querySelector('.image-viewer-backdrop').addEventListener('click', () => viewer.remove())
  viewer.querySelector('.image-viewer-close').addEventListener('click', () => viewer.remove())
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      viewer.remove()
      document.removeEventListener('keydown', escHandler)
    }
  })
}

function updateScreenshotCount() {
  const count = document.querySelectorAll('.gallery-item').length
  const countEl = document.querySelector('.gallery-count')
  if (countEl) {
    countEl.textContent = `${count} screenshots`
  }

  // Show empty state if no screenshots
  if (count === 0) {
    const grid = document.querySelector('.gallery-grid')
    if (grid) {
      grid.innerHTML = `
        <div class="gallery-empty">
          <div class="gallery-empty-icon">&#128247;</div>
          <p>No screenshots yet</p>
          <p class="gallery-hint">Press F12 during gameplay to capture screenshots</p>
        </div>
      `
    }
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function closeScreenshotGallery() {
  document.getElementById('gallery-modal')?.remove()
}
