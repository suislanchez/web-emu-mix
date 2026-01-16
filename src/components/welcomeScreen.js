// Welcome Screen Component - Classic Retro Style
import { renderAuthModal } from './auth.js'

const WELCOME_KEY = 'pixelvault_welcomed'

// Check if user has seen welcome screen
export function hasSeenWelcome() {
  return localStorage.getItem(WELCOME_KEY) === 'true'
}

// Mark welcome as seen
export function markWelcomeSeen() {
  localStorage.setItem(WELCOME_KEY, 'true')
}

// Check if first time visitor (for sign up prompt)
export function isFirstTimeVisitor() {
  return !localStorage.getItem(WELCOME_KEY)
}

// Render the welcome screen
export function renderWelcomeScreen(onEnter) {
  const existing = document.getElementById('welcome-screen')
  if (existing) existing.remove()

  const welcome = document.createElement('div')
  welcome.id = 'welcome-screen'
  welcome.className = 'welcome-screen'
  welcome.innerHTML = `
    <div class="welcome-content">
      <div class="welcome-scanlines"></div>

      <div class="welcome-header">
        <div class="welcome-logo">
          <div class="pixel-controller">
            <svg viewBox="0 0 64 64" width="80" height="80">
              <rect x="8" y="20" width="48" height="28" rx="4" fill="#1a1a2e" stroke="#e94560" stroke-width="2"/>
              <circle cx="20" cy="34" r="8" fill="none" stroke="#e94560" stroke-width="2"/>
              <circle cx="20" cy="34" r="3" fill="#e94560"/>
              <circle cx="44" cy="30" r="4" fill="#00d4ff"/>
              <circle cx="52" cy="34" r="4" fill="#e94560"/>
              <circle cx="44" cy="38" r="4" fill="#7b2cbf"/>
              <rect x="26" y="42" width="12" height="3" rx="1" fill="#e94560"/>
            </svg>
          </div>
          <h1 class="welcome-title">
            <span class="title-pixel">Pixel</span><span class="title-vault">Vault</span>
          </h1>
          <div class="welcome-tagline">CLASSIC GAMING HUB</div>
        </div>
      </div>

      <div class="welcome-features">
        <div class="feature-item">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <circle cx="8" cy="12" r="2"/>
              <circle cx="16" cy="10" r="1.5"/>
              <circle cx="16" cy="14" r="1.5"/>
            </svg>
          </div>
          <span>10+ Classic Systems</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <span>Cloud Saves</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
          </div>
          <span>Achievements</span>
        </div>
      </div>

      <div class="welcome-systems">
        <span class="system-badge">NES</span>
        <span class="system-badge">SNES</span>
        <span class="system-badge">GB</span>
        <span class="system-badge">GBA</span>
        <span class="system-badge">N64</span>
        <span class="system-badge">PS1</span>
        <span class="system-badge">GENESIS</span>
        <span class="system-badge">ARCADE</span>
      </div>

      <div class="welcome-disclaimer">
        <div class="disclaimer-box">
          <div class="disclaimer-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>IMPORTANT NOTICE</span>
          </div>
          <p>PixelVault is a browser-based emulator frontend powered by EmulatorJS. This platform is designed for playing games you legally own.</p>
          <ul>
            <li>Only use ROM files for games you have purchased</li>
            <li>PixelVault does not host, distribute, or provide ROMs</li>
            <li>Respect copyright laws in your jurisdiction</li>
            <li>All game data is stored locally in your browser</li>
          </ul>
        </div>
      </div>

      <div class="welcome-actions">
        <button class="welcome-enter-btn" id="welcome-enter">
          <span class="btn-text">INSERT COIN TO START</span>
          <span class="btn-subtext">Press Enter or Click</span>
        </button>
      </div>

      <div class="welcome-footer">
        <p>Powered by <a href="https://emulatorjs.org" target="_blank">EmulatorJS</a></p>
        <p class="version">v1.0.0</p>
      </div>

      <div class="welcome-decorations">
        <div class="corner-decoration top-left"></div>
        <div class="corner-decoration top-right"></div>
        <div class="corner-decoration bottom-left"></div>
        <div class="corner-decoration bottom-right"></div>
      </div>
    </div>
  `

  document.body.appendChild(welcome)

  // Animate in
  requestAnimationFrame(() => {
    welcome.classList.add('show')
  })

  // Enter button click
  const enterBtn = document.getElementById('welcome-enter')
  enterBtn.addEventListener('click', () => {
    dismissWelcome(onEnter)
  })

  // Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      document.removeEventListener('keydown', handleKeyPress)
      dismissWelcome(onEnter)
    }
  }
  document.addEventListener('keydown', handleKeyPress)
}

function dismissWelcome(onEnter) {
  const welcome = document.getElementById('welcome-screen')
  if (!welcome) return

  // Check if first visit BEFORE marking as seen
  const isFirstVisit = isFirstTimeVisitor()

  welcome.classList.add('fade-out')

  setTimeout(() => {
    markWelcomeSeen()
    welcome.remove()

    // Show the main app
    document.getElementById('app').style.display = 'block'

    // Call callback if provided
    if (onEnter) onEnter()

    // If first time, prompt sign up after a short delay
    if (isFirstVisit) {
      setTimeout(() => {
        showSignUpPrompt()
      }, 2000)
    }
  }, 500)
}

// Show a subtle sign up prompt for first-time visitors
function showSignUpPrompt() {
  const existing = document.getElementById('signup-prompt')
  if (existing) existing.remove()

  const prompt = document.createElement('div')
  prompt.id = 'signup-prompt'
  prompt.className = 'signup-prompt'
  prompt.innerHTML = `
    <div class="prompt-content">
      <div class="prompt-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
      </div>
      <div class="prompt-text">
        <strong>Create a free account</strong>
        <span>Sync saves across devices & unlock achievements</span>
      </div>
      <div class="prompt-actions">
        <button class="prompt-btn primary" id="prompt-signup">Sign Up</button>
        <button class="prompt-btn secondary" id="prompt-dismiss">Maybe Later</button>
      </div>
    </div>
  `

  document.body.appendChild(prompt)

  requestAnimationFrame(() => {
    prompt.classList.add('show')
  })

  document.getElementById('prompt-signup').addEventListener('click', () => {
    prompt.remove()
    renderAuthModal('register')
  })

  document.getElementById('prompt-dismiss').addEventListener('click', () => {
    prompt.classList.add('fade-out')
    setTimeout(() => prompt.remove(), 300)
  })

  // Auto dismiss after 10 seconds
  setTimeout(() => {
    if (document.getElementById('signup-prompt')) {
      prompt.classList.add('fade-out')
      setTimeout(() => prompt.remove(), 300)
    }
  }, 10000)
}

export default { renderWelcomeScreen, hasSeenWelcome, markWelcomeSeen, isFirstTimeVisitor }
