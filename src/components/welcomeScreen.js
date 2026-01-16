// Welcome Screen Component - Professional Modern Style
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
      <div class="welcome-bg-glow"></div>

      <!-- Hero Section with Pipe Kick Animation -->
      <div class="welcome-hero">
        <div class="welcome-logo-container">
          <div class="pipe-kick-scene">
            <div class="ground-line"></div>
            <div class="pipe pipe-1"></div>
            <div class="pipe pipe-2"></div>
            <div class="pipe pipe-3"></div>
            <div class="pixel-character">
              <div class="char-head"></div>
              <div class="char-body"></div>
              <div class="char-leg-back"></div>
              <div class="char-leg-front"></div>
            </div>
          </div>
          <h1 class="welcome-title">
            <span class="title-pixel">Pixel</span><span class="title-vault">Vault</span>
          </h1>
          <p class="welcome-tagline">The Ultimate Retro Gaming Experience</p>
        </div>
      </div>

      <!-- Platform Logos Showcase -->
      <div class="welcome-platforms">
        <div class="platforms-label">Play Your Favorite Classics</div>
        <div class="platforms-grid">
          <div class="platform-logo nintendo">
            <svg viewBox="0 0 100 28" fill="currentColor">
              <text x="50" y="22" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="20" font-weight="bold">NINTENDO</text>
            </svg>
          </div>
          <div class="platform-logo playstation">
            <svg viewBox="0 0 50 50" fill="currentColor">
              <path d="M25 5 L20 45 L25 40 L30 45 Z M15 25 L35 25 L35 30 L15 30 Z"/>
            </svg>
            <span>PlayStation</span>
          </div>
          <div class="platform-logo sega">
            <svg viewBox="0 0 80 24" fill="currentColor">
              <text x="40" y="20" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="22" font-weight="bold" font-style="italic">SEGA</text>
            </svg>
          </div>
          <div class="platform-logo arcade">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="2" width="16" height="20" rx="2"/>
              <rect x="6" y="4" width="12" height="8" rx="1" fill-opacity="0.3"/>
              <circle cx="9" cy="16" r="2"/>
              <circle cx="15" cy="15" r="1.5"/>
              <circle cx="15" cy="18" r="1.5"/>
            </svg>
            <span>Arcade</span>
          </div>
        </div>
      </div>

      <!-- Systems Grid -->
      <div class="welcome-systems-showcase">
        <div class="systems-row">
          <div class="system-card" data-system="nes">
            <div class="system-icon nes">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="8" y="18" width="48" height="28" rx="3"/>
                <rect x="14" y="26" width="12" height="8" rx="1" fill="currentColor"/>
                <circle cx="44" cy="32" r="4"/><circle cx="52" cy="28" r="2.5"/>
              </svg>
            </div>
            <span>NES</span>
          </div>
          <div class="system-card" data-system="snes">
            <div class="system-icon snes">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="6" y="20" width="52" height="24" rx="4"/>
                <rect x="12" y="26" width="14" height="10" rx="2" fill="currentColor"/>
                <circle cx="42" cy="32" r="3"/><circle cx="50" cy="28" r="2.5"/>
              </svg>
            </div>
            <span>SNES</span>
          </div>
          <div class="system-card" data-system="n64">
            <div class="system-icon n64">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M10 28 L32 18 L54 28 L54 42 L32 52 L10 42 Z"/>
                <circle cx="22" cy="36" r="5" fill="currentColor" fill-opacity="0.3"/>
                <circle cx="42" cy="36" r="4" fill="currentColor"/>
              </svg>
            </div>
            <span>N64</span>
          </div>
          <div class="system-card" data-system="gb">
            <div class="system-icon gb">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="16" y="6" width="32" height="52" rx="4"/>
                <rect x="20" y="12" width="24" height="18" rx="2" fill="currentColor" fill-opacity="0.3"/>
                <circle cx="26" cy="42" r="5"/><circle cx="40" cy="40" r="3"/>
              </svg>
            </div>
            <span>Game Boy</span>
          </div>
          <div class="system-card" data-system="gba">
            <div class="system-icon gba">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="4" y="18" width="56" height="28" rx="6"/>
                <rect x="12" y="24" width="18" height="14" rx="2" fill="currentColor" fill-opacity="0.3"/>
                <circle cx="44" cy="32" r="3"/><circle cx="52" cy="28" r="2"/>
              </svg>
            </div>
            <span>GBA</span>
          </div>
          <div class="system-card" data-system="nds">
            <div class="system-icon nds">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="14" y="4" width="36" height="26" rx="3"/>
                <rect x="18" y="8" width="28" height="16" rx="1" fill="currentColor" fill-opacity="0.3"/>
                <rect x="14" y="34" width="36" height="26" rx="3"/>
                <rect x="18" y="38" width="28" height="16" rx="1" fill="currentColor" fill-opacity="0.3"/>
              </svg>
            </div>
            <span>DS</span>
          </div>
          <div class="system-card" data-system="psx">
            <div class="system-icon psx">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="8" y="22" width="48" height="20" rx="4"/>
                <circle cx="22" cy="32" r="5"/><circle cx="22" cy="32" r="2" fill="currentColor"/>
                <rect x="36" y="27" width="4" height="4" rx="1" fill="currentColor"/>
                <rect x="42" y="27" width="4" height="4" rx="1" fill="currentColor"/>
              </svg>
            </div>
            <span>PS1</span>
          </div>
          <div class="system-card" data-system="genesis">
            <div class="system-icon genesis">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="6" y="22" width="52" height="20" rx="3"/>
                <rect x="10" y="16" width="20" height="10" rx="2"/>
                <circle cx="44" cy="32" r="4" fill="currentColor"/>
              </svg>
            </div>
            <span>Genesis</span>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="welcome-features">
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="feature-text">
            <h3>Cloud Saves</h3>
            <p>Sync progress across all your devices</p>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <div class="feature-text">
            <h3>Game Catalog</h3>
            <p>Browse thousands of classic titles</p>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
          </div>
          <div class="feature-text">
            <h3>Achievements</h3>
            <p>Unlock rewards as you play</p>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div class="feature-text">
            <h3>Play Anywhere</h3>
            <p>Browser-based, no downloads needed</p>
          </div>
        </div>
      </div>

      <!-- Legal Notice (Compact) -->
      <div class="welcome-legal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>PixelVault is an emulator frontend. Only play games you legally own. No ROMs are hosted or distributed.</span>
      </div>

      <!-- CTA Section -->
      <div class="welcome-cta">
        <button class="welcome-enter-btn" id="welcome-enter">
          <span class="btn-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <span class="btn-text">Start Playing</span>
          </span>
          <span class="btn-hint">Press Enter</span>
        </button>
        <p class="welcome-stats">Join thousands of retro gaming enthusiasts</p>
      </div>

      <!-- Footer -->
      <div class="welcome-footer">
        <div class="footer-links">
          <span>Powered by <a href="https://emulatorjs.org" target="_blank">EmulatorJS</a></span>
          <span class="divider">•</span>
          <span>Open Source</span>
          <span class="divider">•</span>
          <span>Free Forever</span>
        </div>
        <p class="version">v2.0</p>
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
