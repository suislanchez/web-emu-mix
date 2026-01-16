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
        <div class="about-logo">&#127918;</div>
        <h2>PixelVault</h2>
        <p class="about-version">Version 1.0.0</p>
        <p class="about-description">
          A modern web-based retro gaming platform. Play your favorite classic games
          directly in your browser with save states, cloud saves, and more.
        </p>

        <div class="about-features">
          <div class="about-feature">
            <span class="about-feature-icon">&#127918;</span>
            <span class="about-feature-text">12+ Classic Systems</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon">&#9729;</span>
            <span class="about-feature-text">Cloud Save Support</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon">&#128190;</span>
            <span class="about-feature-text">Local Save States</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon">&#127912;</span>
            <span class="about-feature-text">8 Color Themes</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon">&#128241;</span>
            <span class="about-feature-text">Mobile Friendly</span>
          </div>
          <div class="about-feature">
            <span class="about-feature-icon">&#128100;</span>
            <span class="about-feature-text">User Profiles</span>
          </div>
        </div>

        <div class="about-links">
          <a class="about-link" href="https://emulatorjs.org" target="_blank">
            <span>&#128279;</span> EmulatorJS
          </a>
          <a class="about-link" href="https://github.com/AntimatterReactor/EmulatorJS" target="_blank">
            <span>&#128187;</span> GitHub
          </a>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

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

  // Event listeners
  document.getElementById('shortcuts-close').addEventListener('click', closeShortcutsModal)
  modal.addEventListener('click', (e) => {
    if (e.target.id === 'shortcuts-modal') closeShortcutsModal()
  })
}

export function closeShortcutsModal() {
  document.getElementById('shortcuts-modal')?.remove()
}
