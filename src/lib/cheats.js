// Cheat code management library
const CHEATS_STORAGE_KEY = 'pixelvault_cheats'

// Cheat code types by system
export const CHEAT_TYPES = {
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

// Get all stored cheats
function getAllCheats() {
  try {
    const data = localStorage.getItem(CHEATS_STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('Error loading cheats:', e)
    return {}
  }
}

// Save all cheats
function saveAllCheats(cheats) {
  try {
    localStorage.setItem(CHEATS_STORAGE_KEY, JSON.stringify(cheats))
  } catch (e) {
    console.error('Error saving cheats:', e)
  }
}

// Generate a unique ID for a cheat
function generateCheatId() {
  return 'cheat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Cheats API
export const cheats = {
  // Get cheats for a specific game
  getForGame(gameId) {
    const allCheats = getAllCheats()
    return allCheats[gameId] || []
  },

  // Add a cheat for a game
  add(gameId, cheat) {
    const allCheats = getAllCheats()
    if (!allCheats[gameId]) {
      allCheats[gameId] = []
    }

    const newCheat = {
      id: generateCheatId(),
      name: cheat.name || 'Unnamed Cheat',
      code: cheat.code.toUpperCase().trim(),
      type: cheat.type || 'Raw',
      enabled: cheat.enabled !== false,
      createdAt: Date.now()
    }

    allCheats[gameId].push(newCheat)
    saveAllCheats(allCheats)
    return newCheat
  },

  // Remove a cheat
  remove(gameId, cheatId) {
    const allCheats = getAllCheats()
    if (allCheats[gameId]) {
      allCheats[gameId] = allCheats[gameId].filter(c => c.id !== cheatId)
      saveAllCheats(allCheats)
    }
  },

  // Toggle a cheat on/off
  toggle(gameId, cheatId) {
    const allCheats = getAllCheats()
    if (allCheats[gameId]) {
      const cheat = allCheats[gameId].find(c => c.id === cheatId)
      if (cheat) {
        cheat.enabled = !cheat.enabled
        saveAllCheats(allCheats)
        return cheat.enabled
      }
    }
    return false
  },

  // Update a cheat
  update(gameId, cheatId, updates) {
    const allCheats = getAllCheats()
    if (allCheats[gameId]) {
      const cheat = allCheats[gameId].find(c => c.id === cheatId)
      if (cheat) {
        Object.assign(cheat, updates)
        if (updates.code) {
          cheat.code = updates.code.toUpperCase().trim()
        }
        saveAllCheats(allCheats)
        return cheat
      }
    }
    return null
  },

  // Get enabled cheats for a game (for EmulatorJS)
  getEnabled(gameId) {
    return this.getForGame(gameId).filter(c => c.enabled)
  },

  // Format cheats for EmulatorJS
  formatForEmulator(gameId) {
    const enabledCheats = this.getEnabled(gameId)
    return enabledCheats.map(cheat => ({
      code: cheat.code,
      desc: cheat.name
    }))
  },

  // Clear all cheats for a game
  clearGame(gameId) {
    const allCheats = getAllCheats()
    delete allCheats[gameId]
    saveAllCheats(allCheats)
  },

  // Import cheats from text (one per line, format: "code - name" or just "code")
  importFromText(gameId, text, type = 'Raw') {
    const lines = text.split('\n').filter(line => line.trim())
    const imported = []

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
        name = `Cheat ${imported.length + 1}`
      }

      const newCheat = this.add(gameId, {
        name: name?.trim() || `Cheat ${imported.length + 1}`,
        code: code.trim(),
        type,
        enabled: true
      })
      imported.push(newCheat)
    }

    return imported
  },

  // Export cheats to text
  exportToText(gameId) {
    const gameCheats = this.getForGame(gameId)
    return gameCheats
      .map(c => `${c.code} - ${c.name}`)
      .join('\n')
  },

  // Validate cheat code format (basic validation)
  validateCode(code, type) {
    const cleaned = code.replace(/[\s-]/g, '').toUpperCase()

    switch (type) {
      case 'Game Genie':
        // NES: 6 or 8 chars, SNES: 9 chars, GB: 9 or 6 chars
        return /^[A-Z0-9]{6,9}$/.test(cleaned)

      case 'Pro Action Replay':
        // Usually 8 hex characters
        return /^[A-F0-9]{8}$/.test(cleaned)

      case 'GameShark':
        // 8-16 hex characters
        return /^[A-F0-9]{8,16}$/.test(cleaned)

      case 'Action Replay':
        // DS: 8+8 format
        return /^[A-F0-9]{8,16}$/.test(cleaned)

      case 'CodeBreaker':
        // 8+4 or 8+8 format
        return /^[A-F0-9]{12,16}$/.test(cleaned)

      case 'Raw':
      default:
        // Any hex-like code
        return cleaned.length >= 4 && /^[A-F0-9]+$/.test(cleaned)
    }
  }
}

export default cheats
