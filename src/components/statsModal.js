// Stats Dashboard Modal
import { getPlayStats, formatPlaytime } from '../lib/library.js'

export function renderStatsModal() {
  closeStatsModal()

  const stats = getPlayStats()
  const modal = document.createElement('div')
  modal.id = 'stats-modal'
  modal.className = 'modal-overlay'

  // Calculate some metrics
  const totalPlaytime = stats.totalPlaytime || 0
  const totalSessions = stats.totalSessions || 0
  const avgSessionLength = totalSessions > 0 ? Math.floor(totalPlaytime / totalSessions) : 0

  // Get top games
  const gameEntries = Object.entries(stats.games || {})
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.playtime - a.playtime)
    .slice(0, 5)

  // Get system breakdown
  const systemEntries = Object.entries(stats.systems || {})
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.playtime - a.playtime)

  // Get last 7 days of play
  const dailyData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayData = stats.daily?.[dateStr] || { playtime: 0, sessions: 0 }
    dailyData.push({
      date: dateStr,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      ...dayData
    })
  }

  const maxDailyPlaytime = Math.max(...dailyData.map(d => d.playtime), 1)

  modal.innerHTML = `
    <div class="modal modal-large">
      <button class="modal-close" id="stats-close">&times;</button>
      <div class="stats-content">
        <h2>Play Statistics</h2>

        <div class="stats-overview">
          <div class="stat-box">
            <div class="stat-box-value">${formatPlaytime(totalPlaytime)}</div>
            <div class="stat-box-label">Total Playtime</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${totalSessions}</div>
            <div class="stat-box-label">Total Sessions</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${formatPlaytime(avgSessionLength)}</div>
            <div class="stat-box-label">Avg Session</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${gameEntries.length}</div>
            <div class="stat-box-label">Games Played</div>
          </div>
        </div>

        <div class="stats-section">
          <h3>Last 7 Days</h3>
          <div class="daily-chart">
            ${dailyData.map(d => `
              <div class="chart-bar-container">
                <div class="chart-bar" style="height: ${(d.playtime / maxDailyPlaytime) * 100}%">
                  <span class="chart-tooltip">${formatPlaytime(d.playtime)}</span>
                </div>
                <div class="chart-label">${d.day}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="stats-grid">
          <div class="stats-section">
            <h3>Top Games</h3>
            ${gameEntries.length === 0 ? '<p class="empty-text">No games played yet</p>' : `
              <div class="top-list">
                ${gameEntries.map((game, i) => `
                  <div class="top-item">
                    <span class="top-rank">#${i + 1}</span>
                    <span class="top-name">${game.id.replace(/_/g, ' ').slice(0, 25)}</span>
                    <span class="top-value">${formatPlaytime(game.playtime)}</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <div class="stats-section">
            <h3>By System</h3>
            ${systemEntries.length === 0 ? '<p class="empty-text">No data yet</p>' : `
              <div class="system-breakdown">
                ${systemEntries.map(sys => {
                  const percent = totalPlaytime > 0 ? (sys.playtime / totalPlaytime) * 100 : 0
                  return `
                    <div class="system-stat">
                      <div class="system-stat-header">
                        <span class="system-stat-name">${sys.id.toUpperCase()}</span>
                        <span class="system-stat-value">${formatPlaytime(sys.playtime)}</span>
                      </div>
                      <div class="system-stat-bar">
                        <div class="system-stat-fill" style="width: ${percent}%"></div>
                      </div>
                    </div>
                  `
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Trigger reflow and add show class for animation
  requestAnimationFrame(() => {
    modal.classList.add('show')
  })

  document.getElementById('stats-close').addEventListener('click', closeStatsModal)
  modal.addEventListener('click', (e) => {
    if (e.target.id === 'stats-modal') closeStatsModal()
  })
}

export function closeStatsModal() {
  document.getElementById('stats-modal')?.remove()
}
