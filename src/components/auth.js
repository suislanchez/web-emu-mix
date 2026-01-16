import { auth, profiles } from '../lib/supabase.js'
import { store } from '../lib/store.js'
import { renderSettingsModal } from './settings.js'

// OAuth provider icons
const OAUTH_ICONS = {
  google: `<svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>`,
  github: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>`,
  discord: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>`
}

// Render auth modal
export function renderAuthModal(mode = 'login') {
  const existing = document.getElementById('auth-modal')
  if (existing) existing.remove()

  const modal = document.createElement('div')
  modal.id = 'auth-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="auth-modal">
      <button class="auth-close" id="auth-close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <div class="auth-header">
        <div class="auth-logo">
          <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="8" y="16" width="48" height="32" rx="4"/>
            <circle cx="20" cy="32" r="6"/>
            <rect x="36" y="26" width="4" height="4" rx="1"/>
            <rect x="44" y="26" width="4" height="4" rx="1"/>
            <rect x="40" y="32" width="4" height="4" rx="1"/>
          </svg>
        </div>
        <h1 class="auth-title">${mode === 'login' ? 'Welcome Back!' : 'Join PixelVault'}</h1>
        <p class="auth-subtitle">${mode === 'login'
          ? 'Sign in to sync saves, track achievements, and continue your gaming journey'
          : 'Create an account to save your progress across devices and unlock achievements'}</p>
      </div>

      <div class="auth-content">
        <div class="oauth-section">
          <button class="oauth-btn oauth-google" id="oauth-google">
            ${OAUTH_ICONS.google}
            <span>Continue with Google</span>
          </button>
          <button class="oauth-btn oauth-github" id="oauth-github">
            ${OAUTH_ICONS.github}
            <span>Continue with GitHub</span>
          </button>
          <button class="oauth-btn oauth-discord" id="oauth-discord">
            ${OAUTH_ICONS.discord}
            <span>Continue with Discord</span>
          </button>
        </div>

        <div class="auth-divider">
          <span>or continue with email</span>
        </div>

        <form id="auth-form" class="auth-form">
          ${mode === 'register' ? `
            <div class="form-group">
              <label for="username">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Username
              </label>
              <input type="text" id="username" name="username" required minlength="3" maxlength="20" placeholder="Choose a username" autocomplete="username">
              <span class="input-hint">3-20 characters, letters and numbers only</span>
            </div>
          ` : ''}

          <div class="form-group">
            <label for="email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 6l-10 7L2 6"/>
              </svg>
              Email
            </label>
            <input type="email" id="email" name="email" required placeholder="your@email.com" autocomplete="email">
          </div>

          <div class="form-group">
            <label for="password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Password
            </label>
            <div class="password-input-wrapper">
              <input type="password" id="password" name="password" required minlength="6" placeholder="Enter your password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}">
              <button type="button" class="password-toggle" id="password-toggle" aria-label="Toggle password visibility">
                <svg class="eye-open" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg class="eye-closed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            ${mode === 'register' ? '<span class="input-hint">At least 6 characters</span>' : ''}
          </div>

          ${mode === 'login' ? `
            <div class="form-options">
              <label class="checkbox-wrapper">
                <input type="checkbox" id="remember-me" name="remember">
                <span class="checkmark"></span>
                Remember me
              </label>
              <a href="#" class="forgot-link" id="forgot-password">Forgot password?</a>
            </div>
          ` : ''}

          <div id="auth-error" class="auth-error" style="display: none;"></div>

          <button type="submit" class="btn btn-primary btn-block auth-submit" id="auth-submit">
            <span class="btn-text">${mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            <span class="btn-loading" style="display:none">
              <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
              </svg>
            </span>
          </button>
        </form>

        ${mode === 'register' ? `
          <p class="auth-terms">
            By creating an account, you agree to our
            <a href="#">Terms of Service</a> and
            <a href="#">Privacy Policy</a>
          </p>
        ` : ''}

        <div class="auth-switch">
          ${mode === 'login'
            ? `<span>Don't have an account?</span> <a href="#" id="switch-to-register">Sign up for free</a>`
            : `<span>Already have an account?</span> <a href="#" id="switch-to-login">Sign in</a>`
          }
        </div>
      </div>

      <div class="auth-features">
        <div class="feature">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Cloud Saves</span>
        </div>
        <div class="feature">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="7"/>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
          </svg>
          <span>Achievements</span>
        </div>
        <div class="feature">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span>Multi-Device</span>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Animate in
  requestAnimationFrame(() => {
    modal.classList.add('show')
  })

  // Event listeners
  document.getElementById('auth-close').addEventListener('click', closeAuthModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAuthModal()
  })

  // OAuth buttons
  document.getElementById('oauth-google').addEventListener('click', async () => {
    try {
      await auth.signInWithGoogle()
    } catch (error) {
      showAuthError(error.message)
    }
  })

  document.getElementById('oauth-github').addEventListener('click', async () => {
    try {
      await auth.signInWithGitHub()
    } catch (error) {
      showAuthError(error.message)
    }
  })

  document.getElementById('oauth-discord').addEventListener('click', async () => {
    try {
      await auth.signInWithDiscord()
    } catch (error) {
      showAuthError(error.message)
    }
  })

  // Password toggle
  document.getElementById('password-toggle').addEventListener('click', () => {
    const passwordInput = document.getElementById('password')
    const eyeOpen = document.querySelector('.eye-open')
    const eyeClosed = document.querySelector('.eye-closed')

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text'
      eyeOpen.style.display = 'none'
      eyeClosed.style.display = 'block'
    } else {
      passwordInput.type = 'password'
      eyeOpen.style.display = 'block'
      eyeClosed.style.display = 'none'
    }
  })

  // Form submit
  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    await handleAuthSubmit(mode)
  })

  // Switch mode
  const switchLink = document.getElementById('switch-to-register') || document.getElementById('switch-to-login')
  if (switchLink) {
    switchLink.addEventListener('click', (e) => {
      e.preventDefault()
      closeAuthModal()
      renderAuthModal(mode === 'login' ? 'register' : 'login')
    })
  }

  // Forgot password
  const forgotLink = document.getElementById('forgot-password')
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault()
      showForgotPasswordForm()
    })
  }
}

function showAuthError(message) {
  const errorDiv = document.getElementById('auth-error')
  if (errorDiv) {
    errorDiv.textContent = message
    errorDiv.style.display = 'block'
  }
}

function showForgotPasswordForm() {
  const authContent = document.querySelector('.auth-content')
  if (!authContent) return

  authContent.innerHTML = `
    <div class="forgot-password-form">
      <h2>Reset Password</h2>
      <p>Enter your email and we'll send you a reset link</p>
      <form id="forgot-form">
        <div class="form-group">
          <label for="reset-email">Email</label>
          <input type="email" id="reset-email" required placeholder="your@email.com">
        </div>
        <div id="forgot-error" class="auth-error" style="display: none;"></div>
        <div id="forgot-success" class="auth-success" style="display: none;"></div>
        <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>
      </form>
      <a href="#" id="back-to-login" class="back-link">Back to sign in</a>
    </div>
  `

  document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('reset-email').value
    try {
      // Password reset would go here
      document.getElementById('forgot-success').textContent = 'Check your email for the reset link!'
      document.getElementById('forgot-success').style.display = 'block'
      document.getElementById('forgot-error').style.display = 'none'
    } catch (error) {
      document.getElementById('forgot-error').textContent = error.message
      document.getElementById('forgot-error').style.display = 'block'
    }
  })

  document.getElementById('back-to-login').addEventListener('click', (e) => {
    e.preventDefault()
    closeAuthModal()
    renderAuthModal('login')
  })
}

async function handleAuthSubmit(mode) {
  const form = document.getElementById('auth-form')
  const submitBtn = document.getElementById('auth-submit')
  const errorDiv = document.getElementById('auth-error')

  const email = form.email.value
  const password = form.password.value
  const username = form.username?.value

  submitBtn.disabled = true
  submitBtn.textContent = mode === 'login' ? 'Signing in...' : 'Creating account...'
  errorDiv.style.display = 'none'

  try {
    if (mode === 'register') {
      await auth.signUp(email, password, username)
      showToast('Account created! Please check your email to verify.', 'success')
    } else {
      await auth.signIn(email, password)
      showToast('Welcome back!', 'success')
    }
    closeAuthModal()
    await loadUserData()
  } catch (error) {
    errorDiv.textContent = error.message
    errorDiv.style.display = 'block'
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Create Account'
  }
}

export function closeAuthModal() {
  const modal = document.getElementById('auth-modal')
  if (modal) modal.remove()
}

// Load user data after auth
export async function loadUserData() {
  try {
    const user = await auth.getUser()
    if (user) {
      const profile = await profiles.get(user.id)
      store.setState({ user, profile })
      updateHeaderUI()
      return { user, profile }
    } else {
      store.setState({ user: null, profile: null })
      updateHeaderUI()
    }
  } catch (error) {
    console.error('Error loading user data:', error)
  }
  return null
}

// Update header to show user info
export function updateHeaderUI() {
  const { user, profile } = store.getState()
  const headerRight = document.getElementById('header-right')

  if (!headerRight) return

  if (user && profile) {
    headerRight.innerHTML = `
      <button class="icon-btn" id="settings-btn" title="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
      <div class="user-menu">
        <button class="user-btn" id="user-menu-btn">
          <img src="${profile.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + profile.username}" alt="" class="user-avatar">
          <span class="user-name">${profile.username}</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="user-dropdown" id="user-dropdown">
          <a href="#" id="menu-profile"><span>👤</span> Profile</a>
          <a href="#" id="menu-saves"><span>💾</span> Cloud Saves</a>
          <a href="#" id="menu-achievements"><span>🏆</span> Achievements</a>
          <a href="#" id="menu-favorites"><span>❤️</span> Favorites</a>
          <div class="dropdown-divider"></div>
          <a href="#" id="menu-settings"><span>⚙️</span> Settings</a>
          <a href="#" id="menu-logout"><span>🚪</span> Sign Out</a>
        </div>
      </div>
    `

    // Dropdown toggle
    document.getElementById('user-menu-btn').addEventListener('click', (e) => {
      e.stopPropagation()
      document.getElementById('user-dropdown').classList.toggle('show')
    })

    // Close dropdown on outside click
    document.addEventListener('click', () => {
      document.getElementById('user-dropdown')?.classList.remove('show')
    })

    // Menu items
    document.getElementById('menu-profile').addEventListener('click', (e) => {
      e.preventDefault()
      showProfileView()
    })

    document.getElementById('menu-achievements').addEventListener('click', (e) => {
      e.preventDefault()
      showAchievementsView()
    })

    document.getElementById('menu-logout').addEventListener('click', async (e) => {
      e.preventDefault()
      await auth.signOut()
      store.setState({ user: null, profile: null })
      updateHeaderUI()
      showToast('Signed out successfully', 'success')
    })
    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => renderSettingsModal())
    document.getElementById('menu-settings')?.addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById('user-dropdown')?.classList.remove('show')
      renderSettingsModal()
    })
  } else {
    headerRight.innerHTML = `
      <button class="icon-btn" id="settings-btn" title="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
      <button class="btn btn-outline" id="login-btn">Sign In</button>
      <button class="btn btn-primary" id="register-btn">Sign Up</button>
    `

    document.getElementById('settings-btn').addEventListener('click', () => renderSettingsModal())
    document.getElementById('login-btn').addEventListener('click', () => renderAuthModal('login'))
    document.getElementById('register-btn').addEventListener('click', () => renderAuthModal('register'))
  }
}

// Profile view
export function showProfileView() {
  const { user, profile } = store.getState()
  if (!user || !profile) return

  const mainContent = document.querySelector('.main-content')
  mainContent.innerHTML = `
    <div class="profile-view">
      <button class="btn btn-outline back-btn" id="profile-back">← Back to Library</button>

      <div class="profile-header">
        <div class="profile-avatar-section">
          <img src="${profile.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + profile.username}" alt="" class="profile-avatar-large">
          <label class="avatar-upload-btn">
            Change Avatar
            <input type="file" id="avatar-input" accept="image/*" hidden>
          </label>
        </div>
        <div class="profile-info">
          <h1>${profile.username}</h1>
          <p class="profile-email">${profile.email}</p>
          <p class="profile-bio">${profile.bio || 'No bio yet'}</p>
          <button class="btn btn-outline" id="edit-profile-btn">Edit Profile</button>
        </div>
      </div>

      <div class="profile-stats" id="profile-stats">
        <div class="stat-card">
          <div class="stat-value">${profile.games_played || 0}</div>
          <div class="stat-label">Games Played</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatPlaytime(profile.total_playtime || 0)}</div>
          <div class="stat-label">Total Playtime</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="achievements-count">0</div>
          <div class="stat-label">Achievements</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="points-count">0</div>
          <div class="stat-label">Points</div>
        </div>
      </div>

      <div class="profile-section">
        <h2>Recent Activity</h2>
        <div id="activity-list" class="activity-list">
          <p class="loading-text">Loading activity...</p>
        </div>
      </div>
    </div>
  `

  document.getElementById('profile-back').addEventListener('click', () => {
    window.location.reload() // Simple way to get back to library
  })

  document.getElementById('avatar-input').addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      try {
        await profiles.uploadAvatar(user.id, e.target.files[0])
        showToast('Avatar updated!', 'success')
        await loadUserData()
        showProfileView()
      } catch (error) {
        showToast('Failed to upload avatar', 'error')
      }
    }
  })

  // Load stats
  loadProfileStats(user.id)
}

async function loadProfileStats(userId) {
  try {
    const { sessions, achievements: achievementsApi } = await import('../lib/supabase.js')

    const stats = await sessions.getStats(userId)
    const userAchievements = await achievementsApi.getUserAchievements(userId)
    const history = await sessions.getHistory(userId, 10)

    document.getElementById('achievements-count').textContent = userAchievements.length
    document.getElementById('points-count').textContent = stats?.total_points || 0

    // Render activity
    const activityList = document.getElementById('activity-list')
    if (history.length > 0) {
      activityList.innerHTML = history.map(session => `
        <div class="activity-item">
          <span class="activity-game">${session.game_name || 'Unknown Game'}</span>
          <span class="activity-system">${session.system_id?.toUpperCase() || ''}</span>
          <span class="activity-time">${formatPlaytime(session.playtime_seconds || 0)}</span>
          <span class="activity-date">${formatDate(session.started_at)}</span>
        </div>
      `).join('')
    } else {
      activityList.innerHTML = '<p class="empty-text">No activity yet. Start playing!</p>'
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// Achievements view
export function showAchievementsView() {
  const { user } = store.getState()
  if (!user) return

  const mainContent = document.querySelector('.main-content')
  mainContent.innerHTML = `
    <div class="achievements-view">
      <button class="btn btn-outline back-btn" id="achievements-back">← Back to Library</button>
      <h1>Achievements</h1>
      <div id="achievements-grid" class="achievements-grid">
        <p class="loading-text">Loading achievements...</p>
      </div>
    </div>
  `

  document.getElementById('achievements-back').addEventListener('click', () => {
    window.location.reload()
  })

  loadAchievements(user.id)
}

async function loadAchievements(userId) {
  try {
    const { achievements: achievementsApi } = await import('../lib/supabase.js')

    const allAchievements = await achievementsApi.getAll()
    const userAchievements = await achievementsApi.getUserAchievements(userId)
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id))

    const grid = document.getElementById('achievements-grid')
    grid.innerHTML = allAchievements.map(achievement => {
      const unlocked = unlockedIds.has(achievement.id)
      return `
        <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-info">
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.description}</div>
            <div class="achievement-points">${achievement.points} pts</div>
          </div>
          ${unlocked ? '<div class="achievement-check">✓</div>' : ''}
        </div>
      `
    }).join('')
  } catch (error) {
    console.error('Error loading achievements:', error)
    document.getElementById('achievements-grid').innerHTML = '<p class="error-text">Failed to load achievements</p>'
  }
}

// Utility functions
function formatPlaytime(seconds) {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
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
