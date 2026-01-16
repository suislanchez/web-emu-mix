# RetroPlay

A web-based retro game emulator that lets you play classic console games directly in your browser.

## Supported Systems

- Nintendo Entertainment System (NES)
- Super Nintendo (SNES)
- Game Boy / Game Boy Color / Game Boy Advance
- Nintendo DS
- Nintendo 64
- Sega Genesis / Master System / Game Gear
- PlayStation 1
- Arcade (FBNeo)

## Features

### Emulation
- Drag-and-drop ROM loading with automatic system detection
- Save states (local and cloud)
- Fullscreen mode
- Virtual gamepad for mobile devices
- Auto-save functionality

### User Accounts (via Supabase)
- Email/password authentication
- OAuth support (Google, GitHub, Discord)
- User profiles with avatar uploads
- Cloud save synchronization across devices
- Play session tracking and statistics
- Achievements system with unlockable badges
- Game favorites list

### Social Features
- Game ratings (5-star system)
- Comments on games
- Community ratings aggregation

### Cover Art
- Automatic cover art fetching from LibRetro thumbnail database
- Falls back to screenshots or title screens when box art unavailable
- Local caching to reduce network requests

### Themes
12 built-in color themes including:
- Cyber (default), Retro Pink, Matrix, Synthwave
- Sunset, Ocean, Midnight, Royal Gold
- Monochrome, Game Boy, Cherry Blossom, Arctic

### Settings
- Audio volume control
- FPS display toggle
- Auto-save interval configuration
- Virtual gamepad opacity and visibility
- Scanline filter option
- Notification preferences

## Tech Stack

- Vite for development and building
- EmulatorJS for emulation cores
- Supabase for backend services (auth, database, storage)
- IndexedDB for local ROM storage
- Vanilla JavaScript (no framework)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Supabase project (optional, for cloud features)

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

The app works in offline mode without Supabase credentials (local saves only).

### Database Setup

If using Supabase, import `supabase-schema.sql` to create the required tables:
- profiles
- game_saves
- play_sessions
- comments
- ratings
- achievements
- user_achievements
- favorites

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  main.js           # App entry point and core logic
  style.css         # All styles
  components/
    auth.js         # Authentication UI and logic
    gamePanel.js    # Game info side panel
    settings.js     # Settings modal
  lib/
    supabase.js     # Supabase client and API helpers
    store.js        # Simple state management
    coverArt.js     # Cover art fetching service
    themes.js       # Theme definitions and settings
```

## Legal Notice

Only play games you legally own. This project does not provide or endorse downloading copyrighted ROMs.

## License

MIT
