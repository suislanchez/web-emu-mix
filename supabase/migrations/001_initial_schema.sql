-- PixelVault Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  storage_used BIGINT DEFAULT 0,
  storage_quota BIGINT DEFAULT 5368709120, -- 5GB default
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAME CATALOG TABLE
-- ============================================
CREATE TABLE game_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  system_id TEXT NOT NULL,
  region TEXT,
  cover_url TEXT,
  myrient_path TEXT,
  genres TEXT[],
  description TEXT,
  release_year INTEGER,
  publisher TEXT,
  developer TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_catalog_system ON game_catalog(system_id);
CREATE INDEX idx_game_catalog_title ON game_catalog(title);

-- ============================================
-- USER LIBRARY TABLE
-- ============================================
CREATE TABLE user_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_id UUID REFERENCES game_catalog(id) ON DELETE SET NULL,
  storage_type TEXT NOT NULL DEFAULT 'external', -- 'supabase', 'google_drive', 'dropbox', 'external'
  storage_path TEXT,
  download_status TEXT DEFAULT 'pending', -- 'pending', 'downloading', 'completed', 'failed', 'external'
  file_size BIGINT,
  custom_title TEXT,
  custom_cover_url TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ,
  UNIQUE(user_id, catalog_id, storage_type)
);

CREATE INDEX idx_user_library_user ON user_library(user_id);
CREATE INDEX idx_user_library_status ON user_library(download_status);

-- ============================================
-- GAME SAVES TABLE
-- ============================================
CREATE TABLE game_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  save_path TEXT NOT NULL,
  slot_number INTEGER DEFAULT 0,
  save_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_game_saves_user ON game_saves(user_id);

-- ============================================
-- PLAY SESSIONS TABLE
-- ============================================
CREATE TABLE play_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_name TEXT,
  system_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  playtime_seconds INTEGER DEFAULT 0
);

CREATE INDEX idx_play_sessions_user ON play_sessions(user_id);
CREATE INDEX idx_play_sessions_started ON play_sessions(started_at DESC);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 10,
  condition_type TEXT NOT NULL, -- 'games_played', 'total_playtime', 'systems_played', 'saves_created'
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, points, condition_type, condition_value) VALUES
  ('First Steps', 'Play your first game', 'gamepad', 10, 'games_played', 1),
  ('Getting Started', 'Play 5 games', 'star', 25, 'games_played', 5),
  ('Dedicated Gamer', 'Play 25 games', 'trophy', 50, 'games_played', 25),
  ('Veteran', 'Play 100 games', 'crown', 100, 'games_played', 100),
  ('Quick Session', 'Play for 1 hour total', 'clock', 10, 'total_playtime', 3600),
  ('Marathon', 'Play for 10 hours total', 'fire', 50, 'total_playtime', 36000),
  ('Hardcore', 'Play for 100 hours total', 'medal', 100, 'total_playtime', 360000),
  ('Explorer', 'Try 3 different systems', 'compass', 25, 'systems_played', 3),
  ('Collector', 'Try 5 different systems', 'gem', 50, 'systems_played', 5),
  ('Archivist', 'Create your first save', 'save', 10, 'saves_created', 1),
  ('Backup Pro', 'Create 10 saves', 'database', 25, 'saves_created', 10);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_game ON comments(game_id);

-- ============================================
-- RATINGS TABLE
-- ============================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_ratings_game ON ratings(game_id);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_name TEXT,
  system_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Get user stats function
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_games', (SELECT COUNT(DISTINCT game_id) FROM play_sessions WHERE user_id = user_id_param),
    'total_playtime', (SELECT COALESCE(SUM(playtime_seconds), 0) FROM play_sessions WHERE user_id = user_id_param),
    'systems_played', (SELECT COUNT(DISTINCT system_id) FROM play_sessions WHERE user_id = user_id_param AND system_id IS NOT NULL),
    'saves_count', (SELECT COUNT(*) FROM game_saves WHERE user_id = user_id_param),
    'achievements_count', (SELECT COUNT(*) FROM user_achievements WHERE user_id = user_id_param),
    'favorites_count', (SELECT COUNT(*) FROM favorites WHERE user_id = user_id_param)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user storage quota function
CREATE OR REPLACE FUNCTION update_user_storage_quota(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET storage_used = (
    SELECT COALESCE(SUM(file_size), 0)
    FROM user_library
    WHERE user_id = user_id_param AND storage_type = 'supabase'
  )
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- GAME CATALOG POLICIES (public read)
CREATE POLICY "Anyone can view game catalog"
  ON game_catalog FOR SELECT
  USING (true);

-- USER LIBRARY POLICIES
CREATE POLICY "Users can view own library"
  ON user_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own library"
  ON user_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own library"
  ON user_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own library"
  ON user_library FOR DELETE
  USING (auth.uid() = user_id);

-- GAME SAVES POLICIES
CREATE POLICY "Users can view own saves"
  ON game_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saves"
  ON game_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saves"
  ON game_saves FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saves"
  ON game_saves FOR DELETE
  USING (auth.uid() = user_id);

-- PLAY SESSIONS POLICIES
CREATE POLICY "Users can view own sessions"
  ON play_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON play_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON play_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ACHIEVEMENTS POLICIES (public read)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- USER ACHIEVEMENTS POLICIES
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- COMMENTS POLICIES
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- RATINGS POLICIES
CREATE POLICY "Anyone can view ratings"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- FAVORITES POLICIES
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER game_saves_updated_at
  BEFORE UPDATE ON game_saves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
