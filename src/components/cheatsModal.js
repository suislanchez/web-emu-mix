import {
  getGameCheats, addCheat, removeCheat, toggleCheat, applyAllCheats
} from '../lib/emulatorEnhancements.js'

// Cheat code types by system
const CHEAT_TYPES = {
  nes: ['Game Genie', 'Pro Action Replay', 'Raw'],
  snes: ['Game Genie', 'Pro Action Replay', 'Raw'],
  gb: ['Game Genie', 'GameShark', 'Raw'],
  gbc: ['Game Genie', 'GameShark', 'Raw'],
  gba: ['GameShark', 'Action Replay', 'CodeBreaker', 'Raw'],
  nds: ['Action Replay', 'Raw'],
  n64: ['GameShark', 'Raw'],
  segaMD: ['Game Genie', 'Pro Action Replay', 'Raw'],
  segaMS: ['Pro Action Replay', 'Raw'],
  segaGG: ['Game Genie', 'Pro Action Replay', 'Raw'],
  psx: ['GameShark', 'Raw'],
  arcade: ['Raw']
}

// Render cheats modal
export function renderCheatsModal(gameId, systemId, gameName) {
  const existing = document.getElementById('cheats-modal')
  if (existing) existing.remove()

  const cheatTypes = CHEAT_TYPES[systemId] || ['Raw']
  const gameCheats = getGameCheats(gameId)

  const modal = document.createElement('div')
  modal.id = 'cheats-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="cheats-modal">
      <button class="auth-close" id="cheats-close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <div class="cheats-header">
        <div class="cheats-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h2 class="cheats-title">Cheat Codes</h2>
        <p class="cheats-game-name">${gameName}</p>
      </div>

      <div class="cheats-content">
        <div class="cheats-add-section">
          <h3>Add New Cheat</h3>
          <form id="add-cheat-form" class="add-cheat-form">
            <div class="cheat-form-row">
              <div class="form-group">
                <label for="cheat-name">Name</label>
                <input type="text" id="cheat-name" placeholder="Infinite Lives" required>
              </div>
              <div class="form-group cheat-type-group">
                <label for="cheat-type">Type</label>
                <select id="cheat-type">
                  ${cheatTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="cheat-code">Code</label>
              <input type="text" id="cheat-code" placeholder="AAAA-BBBB-CCCC" required>
              <span class="input-hint" id="code-hint">Enter the cheat code for your system</span>
            </div>
            <button type="submit" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Cheat
            </button>
          </form>
        </div>

        <div class="cheats-divider">
          <span>Active Cheats (${gameCheats.filter(c => c.enabled).length}/${gameCheats.length})</span>
        </div>

        <div class="cheats-list" id="cheats-list">
          ${gameCheats.length === 0 ? `
            <div class="cheats-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <p>No cheats added yet</p>
              <span>Add cheats above to enhance your gameplay</span>
            </div>
          ` : gameCheats.map(cheat => renderCheatItem(cheat)).join('')}
        </div>

        <div class="cheats-actions">
          <button class="btn btn-outline" id="import-cheats-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
          <button class="btn btn-outline" id="apply-cheats-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Apply All
          </button>
          <button class="btn btn-outline btn-danger" id="clear-cheats-btn" ${gameCheats.length === 0 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Clear
          </button>
        </div>
      </div>

      <div class="cheats-footer">
        <p>Cheats are applied in real-time. Click "Apply All" to re-apply enabled cheats.</p>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Animate in
  requestAnimationFrame(() => {
    modal.classList.add('show')
  })

  // Store game context
  modal.dataset.gameId = gameId
  modal.dataset.systemId = systemId

  // Event listeners
  setupCheatsModalEvents(modal, gameId, systemId, gameName)
}

function renderCheatItem(cheat) {
  return `
    <div class="cheat-item ${cheat.enabled ? 'enabled' : 'disabled'}" data-cheat-id="${cheat.id}">
      <label class="cheat-toggle">
        <input type="checkbox" ${cheat.enabled ? 'checked' : ''}>
        <span class="cheat-toggle-slider"></span>
      </label>
      <div class="cheat-info">
        <span class="cheat-name">${cheat.name}</span>
        <code class="cheat-code">${cheat.code}</code>
      </div>
      <button class="cheat-delete" title="Delete cheat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `
}

function setupCheatsModalEvents(modal, gameId, systemId, gameName) {
  // Close button
  document.getElementById('cheats-close').addEventListener('click', closeCheatsModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCheatsModal()
  })

  // Add cheat form
  document.getElementById('add-cheat-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const name = document.getElementById('cheat-name').value.trim()
    const code = document.getElementById('cheat-code').value.trim().toUpperCase()

    if (!name || !code) return

    // Add cheat using the existing API
    addCheat(gameId, name, code)

    // Refresh modal
    closeCheatsModal()
    renderCheatsModal(gameId, systemId, gameName)
  })

  // Cheat list events (toggle and delete)
  document.getElementById('cheats-list').addEventListener('click', (e) => {
    const cheatItem = e.target.closest('.cheat-item')
    if (!cheatItem) return

    const cheatId = cheatItem.dataset.cheatId

    // Toggle checkbox
    if (e.target.type === 'checkbox') {
      toggleCheat(gameId, cheatId)
      cheatItem.classList.toggle('enabled')
      cheatItem.classList.toggle('disabled')
      updateCheatCount(gameId)
    }

    // Delete button
    if (e.target.closest('.cheat-delete')) {
      removeCheat(gameId, cheatId)
      cheatItem.remove()
      updateCheatCount(gameId)

      // Show empty state if no cheats left
      const list = document.getElementById('cheats-list')
      if (list.querySelectorAll('.cheat-item').length === 0) {
        list.innerHTML = `
          <div class="cheats-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <p>No cheats added yet</p>
            <span>Add cheats above to enhance your gameplay</span>
          </div>
        `
      }
    }
  })

  // Import button
  document.getElementById('import-cheats-btn').addEventListener('click', () => {
    showImportDialog(gameId, systemId, gameName)
  })

  // Apply all button
  document.getElementById('apply-cheats-btn').addEventListener('click', () => {
    applyAllCheats(gameId)
    showToast('Cheats applied!')
  })

  // Clear all button
  document.getElementById('clear-cheats-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all cheats for this game?')) {
      // Clear all cheats by saving empty array
      const CHEATS_KEY = 'pixelvault_cheats'
      try {
        const allCheats = JSON.parse(localStorage.getItem(CHEATS_KEY) || '{}')
        delete allCheats[gameId]
        localStorage.setItem(CHEATS_KEY, JSON.stringify(allCheats))
      } catch (e) {
        console.error('Failed to clear cheats:', e)
      }
      closeCheatsModal()
      renderCheatsModal(gameId, systemId, gameName)
    }
  })
}

function updateCheatCount(gameId) {
  const gameCheats = getGameCheats(gameId)
  const divider = document.querySelector('.cheats-divider span')
  if (divider) {
    divider.textContent = `Active Cheats (${gameCheats.filter(c => c.enabled).length}/${gameCheats.length})`
  }

  // Update button states
  const clearBtn = document.getElementById('clear-cheats-btn')
  if (clearBtn) clearBtn.disabled = gameCheats.length === 0
}

function showImportDialog(gameId, systemId, gameName) {
  const dialog = document.createElement('div')
  dialog.className = 'import-dialog'
  dialog.innerHTML = `
    <div class="import-dialog-content">
      <h3>Import Cheats</h3>
      <p>Paste cheat codes below (one per line)</p>
      <p class="import-format-hint">Format: CODE - Name or just CODE</p>
      <textarea id="import-textarea" rows="8" placeholder="AAAA-BBBB - Infinite Lives
CCCC-DDDD - Invincibility
EEEE-FFFF"></textarea>
      <div class="import-actions">
        <button class="btn btn-outline" id="import-cancel">Cancel</button>
        <button class="btn btn-primary" id="import-confirm">Import</button>
      </div>
    </div>
  `

  document.querySelector('.cheats-modal').appendChild(dialog)

  document.getElementById('import-cancel').addEventListener('click', () => {
    dialog.remove()
  })

  document.getElementById('import-confirm').addEventListener('click', () => {
    const text = document.getElementById('import-textarea').value
    const lines = text.split('\n').filter(line => line.trim())
    let importCount = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue

      let code, name
      if (trimmed.includes(' - ')) {
        [code, name] = trimmed.split(' - ', 2)
      } else if (trimmed.includes('\t')) {
        [code, name] = trimmed.split('\t', 2)
      } else {
        code = trimmed
        name = `Cheat ${importCount + 1}`
      }

      addCheat(gameId, name?.trim() || `Cheat ${importCount + 1}`, code.trim())
      importCount++
    }

    dialog.remove()
    closeCheatsModal()
    renderCheatsModal(gameId, systemId, gameName)
    showToast(`Imported ${importCount} cheat(s)`)
  })
}

function showToast(message) {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = 'toast success'
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => toast.remove(), 2000)
}

export function closeCheatsModal() {
  const modal = document.getElementById('cheats-modal')
  if (modal) {
    modal.classList.remove('show')
    setTimeout(() => modal.remove(), 200)
  }
}

// Get cheat count for UI display
export function getCheatCount(gameId) {
  const cheats = getGameCheats(gameId)
  return {
    total: cheats.length,
    enabled: cheats.filter(c => c.enabled).length
  }
}

export default { renderCheatsModal, closeCheatsModal, getCheatCount }
