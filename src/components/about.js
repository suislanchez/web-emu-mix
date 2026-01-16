// About modal
export function renderAboutModal() {
  closeAboutModal()

  const modal = document.createElement('div')
  modal.id = 'about-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="about-close">&times;</button>
      <div class="about-content">
        <div class="about-logo">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <circle cx="7" cy="12" r="2" fill="var(--bg-primary)"/>
            <circle cx="17" cy="10" r="1.5" fill="var(--bg-primary)"/>
            <circle cx="17" cy="14" r="1.5" fill="var(--bg-primary)"/>
            <circle cx="15" cy="12" r="1.5" fill="var(--bg-primary)"/>
            <circle cx="19" cy="12" r="1.5" fill="var(--bg-primary)"/>
          </svg>
        </div>
        <h2>PixelVault</h2>
        <p class="about-version">Version 1.0.0</p>
        <p class="about-description">
          A modern web-based retro gaming platform. Play your favorite classic games
          directly in your browser with save states, cloud saves, and more.
        </p>

        <div class="about-features">
          <div class="about-feature">
            <span class="about-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="17" cy="12" r="1"/></svg></span>
            <span class="about-feature-text">12+ Classic Systems</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg></span>
            <span class="about-feature-text">Cloud Save Support</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg></span>
            <span class="about-feature-text">Local Save States</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg></span>
            <span class="about-feature-text">12 Color Themes</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span>
            <span class="about-feature-text">Mobile Friendly</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
            <span class="about-feature-text">User Profiles</span>
          </div>
        </div>

        <div class="about-links">
          <a class="about-link" href="https://emulatorjs.org" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> EmulatorJS
          </a>
          <a class="about-link" href="https://github.com/AntimatterReactor/EmulatorJS" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> GitHub
          </a>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Trigger reflow and add show class for animation
  requestAnimationFrame(() => {
    modal.classList.add('show')
  })

  // Event listeners
  document.getElementById('about-close').addEventListener('click', closeAboutModal)
  modal.addEventListener('click', (e) => {
    if (e.target.id === 'about-modal') closeAboutModal()
  })
}

export function closeAboutModal() {
  document.getElementById('about-modal')?.remove()
}

// Keyboard shortcuts modal
export function renderShortcutsModal() {
  closeShortcutsModal()

  const modal = document.createElement('div')
  modal.id = 'shortcuts-modal'
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="shortcuts-close">&times;</button>
      <div class="shortcuts-content">
        <h2>Keyboard Shortcuts</h2>

        <div class="shortcuts-grid">
          <div class="shortcuts-category">
            <h4>Emulator Controls</h4>
            <div class="shortcut-row">
              <span>Save State</span>
              <div class="shortcut-keys"><kbd>F5</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>Load State</span>
              <div class="shortcut-keys"><kbd>F8</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>Toggle Fullscreen</span>
              <div class="shortcut-keys"><kbd>F11</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>Pause / Resume</span>
              <div class="shortcut-keys"><kbd>P</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>Mute Audio</span>
              <div class="shortcut-keys"><kbd>M</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>Take Screenshot</span>
              <div class="shortcut-keys"><kbd>F12</kbd></div>
            </div>
          </div>

          <div class="shortcuts-category">
            <h4>Game Controls (Default)</h4>
            <div class="shortcut-row">
              <span>D-Pad</span>
              <div class="shortcut-keys"><kbd>&#8593;</kbd><kbd>&#8595;</kbd><kbd>&#8592;</kbd><kbd>&#8594;</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>A / B Buttons</span>
              <div class="shortcut-keys"><kbd>X</kbd><kbd>Z</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>Start</span>
              <div class="shortcut-keys"><kbd>Enter</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>Select</span>
              <div class="shortcut-keys"><kbd>Shift</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>L / R Triggers</span>
              <div class="shortcut-keys"><kbd>Q</kbd><kbd>E</kbd></div>
            </div>
          </div>

          <div class="shortcuts-category">
            <h4>Application</h4>
            <div class="shortcut-row">
              <span>Open Settings</span>
              <div class="shortcut-keys"><kbd>Ctrl</kbd><kbd>,</kbd></div>
            </div>
            <div class="shortcut-row">
              <span>Show Shortcuts</span>
              <div class="shortcut-keys"><kbd>?</kbd></div>
            </div>
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

  // Event listeners
  document.getElementById('shortcuts-close').addEventListener('click', closeShortcutsModal)
  modal.addEventListener('click', (e) => {
    if (e.target.id === 'shortcuts-modal') closeShortcutsModal()
  })
}

export function closeShortcutsModal() {
  document.getElementById('shortcuts-modal')?.remove()
}
