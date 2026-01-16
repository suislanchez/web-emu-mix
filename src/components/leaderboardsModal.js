// Leaderboards Modal
import { getHighScores, addHighScore, deleteHighScore, clearHighScores, getAllHighScores } from '../lib/library.js'

export function renderLeaderboardsModal(gameId = null, gameName = null) {
  closeLeaderboardsModal()

  const modal = document.createElement('div')
  modal.id = 'leaderboards-modal'
  modal.className = 'modal-overlay'

  const isGameSpecific = !!gameId
  const scores = isGameSpecific ? getHighScores(gameId) : getAllHighScores()

  modal.innerHTML = `
    <div class="modal modal-large">
      <button class="modal-close" id="leaderboards-close">&times;</button>
      <div class="leaderboards-content">
        <div class="leaderboards-header">
          <h2>${isGameSpecific ? `High Scores: ${gameName}` : 'Global Leaderboard'}</h2>
          ${isGameSpecific ? `
            <button class="btn btn-outline btn-sm" id="add-score-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Score
            </button>
          ` : ''}
        </div>

        ${scores.length === 0 ? `
          <div class="leaderboards-empty">
            <div class="leaderboards-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </div>
            <p>No high scores yet</p>
            <p class="leaderboards-hint">Be the first to set a record!</p>
          </div>
        ` : `
          <div class="leaderboards-table">
            <div class="leaderboards-row header">
              <span class="rank-col">Rank</span>
              <span class="player-col">Player</span>
              ${!isGameSpecific ? '<span class="game-col">Game</span>' : ''}
              <span class="score-col">Score</span>
              <span class="date-col">Date</span>
              ${isGameSpecific ? '<span class="action-col"></span>' : ''}
            </div>
            ${scores.map((score, index) => `
              <div class="leaderboards-row ${index < 3 ? `top-${index + 1}` : ''}" data-id="${score.id}" data-game-id="${score.gameId || gameId}">
                <span class="rank-col">
                  ${index === 0 ? '<span class="medal gold">1st</span>' :
                    index === 1 ? '<span class="medal silver">2nd</span>' :
                    index === 2 ? '<span class="medal bronze">3rd</span>' :
                    `#${index + 1}`}
                </span>
                <span class="player-col">${score.playerName}</span>
                ${!isGameSpecific ? `<span class="game-col">${score.gameName || 'Unknown'}</span>` : ''}
                <span class="score-col">${formatScore(score.score)}</span>
                <span class="date-col">${formatDate(score.timestamp)}</span>
                ${isGameSpecific ? `
                  <span class="action-col">
                    <button class="delete-score-btn" title="Delete">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </span>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `}

        ${isGameSpecific && scores.length > 0 ? `
          <div class="leaderboards-footer">
            <button class="btn btn-outline btn-sm btn-danger" id="clear-scores-btn">Clear All Scores</button>
          </div>
        ` : ''}
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Trigger reflow and add show class for animation
  requestAnimationFrame(() => {
    modal.classList.add('show')
  })

  setupLeaderboardsEvents(gameId, gameName)
}

function setupLeaderboardsEvents(gameId, gameName) {
  document.getElementById('leaderboards-close').addEventListener('click', closeLeaderboardsModal)
  document.getElementById('leaderboards-modal').addEventListener('click', (e) => {
    if (e.target.id === 'leaderboards-modal') closeLeaderboardsModal()
  })

  // Add score button
  const addScoreBtn = document.getElementById('add-score-btn')
  if (addScoreBtn) {
    addScoreBtn.addEventListener('click', () => {
      showAddScoreDialog(gameId, gameName)
    })
  }

  // Delete score buttons
  document.querySelectorAll('.delete-score-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const row = btn.closest('.leaderboards-row')
      const scoreId = row.dataset.id
      const scoreGameId = row.dataset.gameId

      if (confirm('Delete this score?')) {
        deleteHighScore(scoreGameId, scoreId)
        row.remove()
        updateEmptyState()
      }
    })
  })

  // Clear all scores button
  const clearBtn = document.getElementById('clear-scores-btn')
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Delete all high scores for this game?')) {
        clearHighScores(gameId)
        renderLeaderboardsModal(gameId, gameName)
      }
    })
  }
}

function showAddScoreDialog(gameId, gameName) {
  const dialog = document.createElement('div')
  dialog.className = 'score-dialog'
  dialog.innerHTML = `
    <div class="score-dialog-content">
      <h3>Add High Score</h3>
      <div class="dialog-form">
        <div class="form-group">
          <label for="player-name-input">Player Name</label>
          <input type="text" id="player-name-input" placeholder="Enter name" maxlength="20" value="Player" />
        </div>
        <div class="form-group">
          <label for="score-input">Score</label>
          <input type="number" id="score-input" placeholder="Enter score" min="0" />
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-outline dialog-cancel">Cancel</button>
        <button class="btn btn-primary dialog-confirm">Add Score</button>
      </div>
    </div>
  `

  document.body.appendChild(dialog)

  const playerInput = document.getElementById('player-name-input')
  const scoreInput = document.getElementById('score-input')

  dialog.querySelector('.dialog-cancel').addEventListener('click', () => dialog.remove())
  dialog.querySelector('.dialog-confirm').addEventListener('click', () => {
    const playerName = playerInput.value.trim() || 'Player'
    const score = parseInt(scoreInput.value)

    if (!isNaN(score) && score >= 0) {
      addHighScore(gameId, gameName, score, playerName)
      dialog.remove()
      renderLeaderboardsModal(gameId, gameName)
    } else {
      scoreInput.classList.add('error')
    }
  })

  scoreInput.focus()
}

function updateEmptyState() {
  const table = document.querySelector('.leaderboards-table')
  const rows = table?.querySelectorAll('.leaderboards-row:not(.header)')

  if (table && rows?.length === 0) {
    table.innerHTML = `
      <div class="leaderboards-empty">
        <div class="leaderboards-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
          </svg>
        </div>
        <p>No high scores yet</p>
        <p class="leaderboards-hint">Be the first to set a record!</p>
      </div>
    `
  }
}

function formatScore(score) {
  return score.toLocaleString()
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit'
  })
}

export function closeLeaderboardsModal() {
  document.getElementById('leaderboards-modal')?.remove()
  document.querySelector('.score-dialog')?.remove()
}
