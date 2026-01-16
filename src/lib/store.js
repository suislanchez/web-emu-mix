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
      store.setState({ recentGames: JSON.parse(stored) })
    }
  } catch (e) {
    console.error('Failed to load recent games:', e)
  }
}
