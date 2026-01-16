// Collections Modal
import {
  getCollections,
  createCollection,
  deleteCollection,
  renameCollection,
  addToCollection,
  removeFromCollection,
  getGameCollections
} from '../lib/library.js'

const COLLECTION_ICONS = ['folder', 'gamepad', 'star', 'heart', 'trophy', 'target', 'fire', 'gem', 'sparkle', 'dice', 'alien', 'joystick']

// SVG icons for collections
const ICON_SVGS = {
  folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  gamepad: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="17" cy="12" r="1"/></svg>',
  star: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  trophy: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  target: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  fire: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  gem: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/><line x1="12" y1="22" x2="12" y2="9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="6" y1="3" x2="9" y2="9"/><line x1="18" y1="3" x2="15" y2="9"/></svg>',
  sparkle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/><path d="M5 19l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z"/><path d="M19 5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L17 7l1.5-.5.5-1.5z"/></svg>',
  dice: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  alien: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 2 4 6 4 12c0 4 2 8 8 10 6-2 8-6 8-10 0-6-4-10-8-10z"/><circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><path d="M9 16c1.5 1 4.5 1 6 0"/></svg>',
  joystick: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="14"/><rect x="4" y="14" width="16" height="6" rx="2"/></svg>'
}

function getIconSvg(iconName) {
  return ICON_SVGS[iconName] || ICON_SVGS.folder
}

export function renderCollectionsModal(gameId = null, gameName = null) {
  closeCollectionsModal()

  const collections = getCollections()
  const gameCollections = gameId ? getGameCollections(gameId) : []
  const isAddingToGame = !!gameId

  const modal = document.createElement('div')
  modal.id = 'collections-modal'
  modal.className = 'modal-overlay'

  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="collections-close">&times;</button>
      <div class="collections-content">
        <h2>${isAddingToGame ? 'Add to Collection' : 'My Collections'}</h2>
        ${isAddingToGame ? `<p class="collections-subtitle">Select collections for "${gameName}"</p>` : ''}

        <div class="collections-list" id="collections-list">
          ${collections.length === 0 ? `
            <div class="collections-empty">
              <p>No collections yet</p>
              <p class="collections-hint">Create a collection to organize your games</p>
            </div>
          ` : collections.map(col => `
            <div class="collection-item ${gameCollections.find(c => c.id === col.id) ? 'selected' : ''}" data-id="${col.id}">
              <span class="collection-icon">${getIconSvg(col.icon)}</span>
              <span class="collection-name">${col.name}</span>
              <span class="collection-count">${col.games.length} games</span>
              ${isAddingToGame ? `
                <label class="collection-checkbox">
                  <input type="checkbox" ${gameCollections.find(c => c.id === col.id) ? 'checked' : ''} />
                  <span class="checkmark"></span>
                </label>
              ` : `
                <div class="collection-actions">
                  <button class="collection-edit-btn" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  <button class="collection-delete-btn" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
              `}
            </div>
          `).join('')}
        </div>

        <div class="collections-footer">
          <button class="btn btn-outline" id="create-collection-btn">
            <span>+</span> New Collection
          </button>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Trigger reflow and add show class for animation
  requestAnimationFrame(() => {
    modal.classList.add('show')
  })

  setupCollectionEvents(gameId)
}

function setupCollectionEvents(gameId) {
  document.getElementById('collections-close').addEventListener('click', closeCollectionsModal)
  document.getElementById('collections-modal').addEventListener('click', (e) => {
    if (e.target.id === 'collections-modal') closeCollectionsModal()
  })

  // Create new collection
  document.getElementById('create-collection-btn').addEventListener('click', () => {
    showCreateCollectionDialog(gameId)
  })

  // Collection checkboxes (when adding to game)
  if (gameId) {
    document.querySelectorAll('.collection-item input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const item = checkbox.closest('.collection-item')
        const collectionId = item.dataset.id

        if (checkbox.checked) {
          addToCollection(collectionId, gameId)
          item.classList.add('selected')
        } else {
          removeFromCollection(collectionId, gameId)
          item.classList.remove('selected')
        }
        updateCollectionCounts()
      })
    })
  } else {
    // Edit collection buttons
    document.querySelectorAll('.collection-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const item = btn.closest('.collection-item')
        const collectionId = item.dataset.id
        const name = item.querySelector('.collection-name').textContent
        showEditCollectionDialog(collectionId, name)
      })
    })

    // Delete collection buttons
    document.querySelectorAll('.collection-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const item = btn.closest('.collection-item')
        const collectionId = item.dataset.id
        const name = item.querySelector('.collection-name').textContent

        if (confirm(`Delete collection "${name}"? Games in this collection will not be deleted.`)) {
          deleteCollection(collectionId)
          item.remove()
          checkEmptyState()
        }
      })
    })

    // Click collection to view games
    document.querySelectorAll('.collection-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.collection-actions')) return
        const collectionId = item.dataset.id
        // Dispatch event to filter by collection
        window.dispatchEvent(new CustomEvent('filterByCollection', { detail: { collectionId } }))
        closeCollectionsModal()
      })
    })
  }
}

function showCreateCollectionDialog(gameId = null) {
  const dialog = document.createElement('div')
  dialog.className = 'collection-dialog'
  dialog.innerHTML = `
    <div class="collection-dialog-content">
      <h3>New Collection</h3>
      <div class="dialog-form">
        <div class="icon-selector">
          ${COLLECTION_ICONS.map((icon, i) => `
            <button class="icon-option ${i === 0 ? 'selected' : ''}" data-icon="${icon}">${getIconSvg(icon)}</button>
          `).join('')}
        </div>
        <input type="text" id="collection-name-input" placeholder="Collection name" maxlength="30" />
      </div>
      <div class="dialog-actions">
        <button class="btn btn-outline dialog-cancel">Cancel</button>
        <button class="btn btn-primary dialog-confirm">Create</button>
      </div>
    </div>
  `

  document.body.appendChild(dialog)

  let selectedIcon = COLLECTION_ICONS[0]

  dialog.querySelectorAll('.icon-option').forEach(btn => {
    btn.addEventListener('click', () => {
      dialog.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'))
      btn.classList.add('selected')
      selectedIcon = btn.dataset.icon
    })
  })

  dialog.querySelector('.dialog-cancel').addEventListener('click', () => dialog.remove())
  dialog.querySelector('.dialog-confirm').addEventListener('click', () => {
    const name = document.getElementById('collection-name-input').value.trim()
    if (name) {
      const collectionId = createCollection(name, selectedIcon)
      if (gameId) {
        addToCollection(collectionId, gameId)
      }
      dialog.remove()
      renderCollectionsModal(gameId)
    }
  })

  document.getElementById('collection-name-input').focus()
}

function showEditCollectionDialog(collectionId, currentName) {
  const dialog = document.createElement('div')
  dialog.className = 'collection-dialog'
  dialog.innerHTML = `
    <div class="collection-dialog-content">
      <h3>Edit Collection</h3>
      <div class="dialog-form">
        <input type="text" id="collection-name-input" value="${currentName}" placeholder="Collection name" maxlength="30" />
      </div>
      <div class="dialog-actions">
        <button class="btn btn-outline dialog-cancel">Cancel</button>
        <button class="btn btn-primary dialog-confirm">Save</button>
      </div>
    </div>
  `

  document.body.appendChild(dialog)

  dialog.querySelector('.dialog-cancel').addEventListener('click', () => dialog.remove())
  dialog.querySelector('.dialog-confirm').addEventListener('click', () => {
    const name = document.getElementById('collection-name-input').value.trim()
    if (name) {
      renameCollection(collectionId, name)
      dialog.remove()
      renderCollectionsModal()
    }
  })

  document.getElementById('collection-name-input').focus()
  document.getElementById('collection-name-input').select()
}

function updateCollectionCounts() {
  const collections = getCollections()
  document.querySelectorAll('.collection-item').forEach(item => {
    const col = collections.find(c => c.id === item.dataset.id)
    if (col) {
      item.querySelector('.collection-count').textContent = `${col.games.length} games`
    }
  })
}

function checkEmptyState() {
  const list = document.getElementById('collections-list')
  if (list && list.querySelectorAll('.collection-item').length === 0) {
    list.innerHTML = `
      <div class="collections-empty">
        <p>No collections yet</p>
        <p class="collections-hint">Create a collection to organize your games</p>
      </div>
    `
  }
}

export function closeCollectionsModal() {
  document.getElementById('collections-modal')?.remove()
  document.querySelector('.collection-dialog')?.remove()
}
