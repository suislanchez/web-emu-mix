// Simple reactive store for app state

const createStore = (initialState) => {
  let state = { ...initialState }
  const listeners = new Set()

  return {
    getState: () => state,

    setState: (updates) => {
      state = { ...state, ...updates }
      listeners.forEach(listener => listener(state))
    },

    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}

// App store
export const store = createStore({
  user: null,
  profile: null,
  isLoading: true,
  selectedSystem: null,
  currentGame: null,
  currentSession: null,
  recentGames: [],
  favorites: [],
  achievements: [],
  userAchievements: [],
  stats: null,
  view: 'library', // 'library', 'emulator', 'profile', 'auth'
})

// Helper to update and persist recent games to localStorage
export function updateRecentGames(games) {
  store.setState({ recentGames: games })
  localStorage.setItem('retroplay_recent', JSON.stringify(games))
}

// Load recent games from localStorage
export function loadRecentGames() {
  try {
    const stored = localStorage.getItem('retroplay_recent')
    if (stored) {
      const games = JSON.parse(stored)
      store.setState({ recentGames: games })
      return games
    }
  } catch (e) {
    console.error('Failed to load recent games:', e)
  }
  return store.getState().recentGames || []
}

// Delete a game by ID
export function deleteGameById(gameId) {
  const { recentGames } = store.getState()
  const index = recentGames.findIndex(g => g.id === gameId || g.fileName === gameId)
  if (index !== -1) {
    const updatedGames = [...recentGames]
    updatedGames.splice(index, 1)
    updateRecentGames(updatedGames)
    return true
  }
  return false
}
