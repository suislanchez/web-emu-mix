-- RetroPlay Database Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text,
  avatar_url text,
  bio text,
  total_playtime integer default 0,
  games_played integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- GAME SAVES TABLE
-- ============================================
create table public.game_saves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_id text not null,
  game_name text,
  system_id text,
  save_path text not null,
  slot integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, game_id)
);

alter table public.game_saves enable row level security;

create policy "Users can view own saves"
  on public.game_saves for select
  using (auth.uid() = user_id);

create policy "Users can create own saves"
  on public.game_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saves"
  on public.game_saves for update
  using (auth.uid() = user_id);

create policy "Users can delete own saves"
  on public.game_saves for delete
  using (auth.uid() = user_id);

-- ============================================
-- PLAY SESSIONS TABLE
-- ============================================
create table public.play_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_id text not null,
  game_name text,
  system_id text,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  playtime_seconds integer default 0
);

alter table public.play_sessions enable row level security;

create policy "Users can view own sessions"
  on public.play_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create own sessions"
  on public.play_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.play_sessions for update
  using (auth.uid() = user_id);

-- ============================================
-- COMMENTS TABLE
-- ============================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_id text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Users can create comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- ============================================
-- RATINGS TABLE
-- ============================================
create table public.ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_id text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, game_id)
);

alter table public.ratings enable row level security;

create policy "Ratings are viewable by everyone"
  on public.ratings for select
  using (true);

create policy "Users can create ratings"
  on public.ratings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ratings"
  on public.ratings for update
  using (auth.uid() = user_id);

-- ============================================
-- FAVORITES TABLE
-- ============================================
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_id text not null,
  game_name text,
  system_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, game_id)
);

alter table public.favorites enable row level security;

create policy "Users can view own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can create favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text not null,
  icon text not null,
  points integer default 10,
  condition_type text not null, -- 'games_played', 'total_playtime', 'systems_played', 'saves_created'
  condition_value integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.achievements enable row level security;

create policy "Achievements are viewable by everyone"
  on public.achievements for select
  using (true);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
create table public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "User achievements are viewable by everyone"
  on public.user_achievements for select
  using (true);

create policy "Users can unlock achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get user stats
create or replace function get_user_stats(user_id_param uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'total_games', (select count(distinct game_id) from play_sessions where user_id = user_id_param),
    'total_playtime', (select coalesce(sum(playtime_seconds), 0) from play_sessions where user_id = user_id_param),
    'systems_played', (select count(distinct system_id) from play_sessions where user_id = user_id_param),
    'saves_count', (select count(*) from game_saves where user_id = user_id_param),
    'favorites_count', (select count(*) from favorites where user_id = user_id_param),
    'achievements_count', (select count(*) from user_achievements where user_id = user_id_param),
    'total_points', (
      select coalesce(sum(a.points), 0)
      from user_achievements ua
      join achievements a on ua.achievement_id = a.id
      where ua.user_id = user_id_param
    )
  ) into result;

  return result;
end;
$$;

-- Function to update profile stats (called by trigger)
create or replace function update_profile_stats()
returns trigger
language plpgsql
security definer
as $$
begin
  update profiles
  set
    total_playtime = (select coalesce(sum(playtime_seconds), 0) from play_sessions where user_id = NEW.user_id),
    games_played = (select count(distinct game_id) from play_sessions where user_id = NEW.user_id),
    updated_at = now()
  where id = NEW.user_id;

  return NEW;
end;
$$;

-- Trigger to update profile stats after play session ends
create trigger on_play_session_end
  after update of ended_at on play_sessions
  for each row
  when (OLD.ended_at is null and NEW.ended_at is not null)
  execute function update_profile_stats();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets (run these in SQL or via Dashboard > Storage)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('saves', 'saves', false);
insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true);

-- Storage policies for avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for saves
create policy "Users can access their own saves"
  on storage.objects for select
  using (bucket_id = 'saves' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own saves"
  on storage.objects for insert
  with check (bucket_id = 'saves' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own saves"
  on storage.objects for update
  using (bucket_id = 'saves' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own saves"
  on storage.objects for delete
  using (bucket_id = 'saves' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- SEED DATA: DEFAULT ACHIEVEMENTS
-- ============================================
insert into public.achievements (name, description, icon, points, condition_type, condition_value) values
  ('First Steps', 'Play your first game', '🎮', 10, 'games_played', 1),
  ('Getting Started', 'Play 5 different games', '🕹️', 25, 'games_played', 5),
  ('Game Collector', 'Play 25 different games', '📚', 50, 'games_played', 25),
  ('Gaming Legend', 'Play 100 different games', '🏆', 100, 'games_played', 100),
  ('Quick Session', 'Play for 1 hour total', '⏱️', 10, 'total_playtime', 3600),
  ('Dedicated Gamer', 'Play for 10 hours total', '🎯', 50, 'total_playtime', 36000),
  ('No Life', 'Play for 100 hours total', '😅', 100, 'total_playtime', 360000),
  ('Multi-Platform', 'Play games on 3 different systems', '🌐', 25, 'systems_played', 3),
  ('System Master', 'Play games on 8 different systems', '👑', 75, 'systems_played', 8),
  ('Save Scummer', 'Create your first save', '💾', 10, 'saves_created', 1),
  ('Backup Pro', 'Create 10 saves', '🗄️', 25, 'saves_created', 10),
  ('Data Hoarder', 'Create 50 saves', '📦', 50, 'saves_created', 50);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
create index idx_play_sessions_user_id on play_sessions(user_id);
create index idx_play_sessions_game_id on play_sessions(game_id);
create index idx_comments_game_id on comments(game_id);
create index idx_ratings_game_id on ratings(game_id);
create index idx_favorites_user_id on favorites(user_id);
create index idx_game_saves_user_id on game_saves(user_id);

-- ============================================
-- GAME CATALOG TABLE (Indexed games from Myrient)
-- ============================================
create table public.game_catalog (
  id uuid default uuid_generate_v4() primary key,
  myrient_path text unique not null,
  title text not null,
  system_id text not null,
  region text,
  languages text[],
  version text,
  file_size bigint,
  file_extension text default 'zip',

  -- IGDB metadata (populated async)
  igdb_id integer,
  description text,
  genres text[],
  series text,
  release_date date,
  developer text,
  publisher text,
  cover_url text,
  igdb_rating numeric(5,2),

  -- Timestamps
  indexed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata_updated_at timestamp with time zone,

  -- Full-text search vector
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(series, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);

alter table public.game_catalog enable row level security;

-- Game catalog is publicly readable (no auth required to browse)
create policy "Game catalog is publicly readable"
  on public.game_catalog for select
  using (true);

-- Indexes for efficient searching and filtering
create index idx_game_catalog_system on game_catalog(system_id);
create index idx_game_catalog_title on game_catalog(lower(title));
create index idx_game_catalog_search on game_catalog using gin(search_vector);
create index idx_game_catalog_genres on game_catalog using gin(genres);
create index idx_game_catalog_region on game_catalog(region);
create index idx_game_catalog_series on game_catalog(series);

-- ============================================
-- USER LIBRARY TABLE (User's game collection)
-- ============================================
create table public.user_library (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  catalog_id uuid references public.game_catalog(id) on delete set null,

  -- Storage location (one of: supabase, local, google_drive, dropbox)
  storage_type text not null check (storage_type in ('supabase', 'local', 'google_drive', 'dropbox')),
  storage_path text,
  storage_file_id text,

  -- File info
  local_filename text,
  file_size bigint,

  -- User can override catalog metadata
  custom_title text,
  custom_cover_url text,

  -- Download tracking
  download_status text default 'pending' check (download_status in ('pending', 'downloading', 'completed', 'failed', 'external')),
  download_progress integer default 0,

  -- Timestamps
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_played_at timestamp with time zone,

  unique(user_id, catalog_id, storage_type)
);

alter table public.user_library enable row level security;

create policy "Users can view own library"
  on public.user_library for select
  using (auth.uid() = user_id);

create policy "Users can add to own library"
  on public.user_library for insert
  with check (auth.uid() = user_id);

create policy "Users can update own library"
  on public.user_library for update
  using (auth.uid() = user_id);

create policy "Users can delete from own library"
  on public.user_library for delete
  using (auth.uid() = user_id);

create index idx_user_library_user on user_library(user_id);
create index idx_user_library_status on user_library(download_status);
create index idx_user_library_catalog on user_library(catalog_id);

-- ============================================
-- EXTERNAL STORAGE CONNECTIONS TABLE
-- ============================================
create table public.external_storage_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null check (provider in ('google_drive', 'dropbox')),

  -- OAuth tokens (these should be encrypted in production)
  access_token text not null,
  refresh_token text,
  token_expires_at timestamp with time zone,

  -- Account info
  account_email text,
  storage_quota_bytes bigint,
  storage_used_bytes bigint,

  -- App folder for RetroPlay files
  app_folder_id text,
  app_folder_path text,

  connected_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_synced_at timestamp with time zone,

  unique(user_id, provider)
);

alter table public.external_storage_connections enable row level security;

create policy "Users can view own storage connections"
  on public.external_storage_connections for select
  using (auth.uid() = user_id);

create policy "Users can create own storage connections"
  on public.external_storage_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own storage connections"
  on public.external_storage_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own storage connections"
  on public.external_storage_connections for delete
  using (auth.uid() = user_id);

-- ============================================
-- USER STORAGE QUOTAS TABLE (for Supabase storage)
-- ============================================
create table public.user_storage_quotas (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  quota_bytes bigint default 5368709120, -- 5GB default
  used_bytes bigint default 0,
  last_calculated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_storage_quotas enable row level security;

create policy "Users can view own quota"
  on public.user_storage_quotas for select
  using (auth.uid() = user_id);

-- Only the system can update quotas (via service role)
create policy "Service can manage quotas"
  on public.user_storage_quotas for all
  using (true)
  with check (true);

-- ============================================
-- USER ROMS STORAGE BUCKET
-- ============================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user_roms',
  'user_roms',
  false,
  536870912, -- 512MB max file size
  array['application/zip', 'application/x-7z-compressed', 'application/octet-stream', 'application/x-zip-compressed']
);

-- Storage policies for user ROMs
create policy "Users can access their own ROMs"
  on storage.objects for select
  using (bucket_id = 'user_roms' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own ROMs"
  on storage.objects for insert
  with check (bucket_id = 'user_roms' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own ROMs"
  on storage.objects for update
  using (bucket_id = 'user_roms' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own ROMs"
  on storage.objects for delete
  using (bucket_id = 'user_roms' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- HELPER FUNCTIONS FOR GAME CATALOG
-- ============================================

-- Function to get distinct genres from the catalog
create or replace function get_distinct_genres()
returns table(genre text, count bigint)
language sql
security definer
as $$
  select unnest(genres) as genre, count(*) as count
  from game_catalog
  where genres is not null
  group by genre
  order by count desc;
$$;

-- Function to get distinct series from the catalog
create or replace function get_distinct_series()
returns table(series text, count bigint)
language sql
security definer
as $$
  select series, count(*) as count
  from game_catalog
  where series is not null
  group by series
  order by count desc;
$$;

-- Function to update user storage quota (called after uploads/deletions)
create or replace function update_user_storage_quota(user_id_param uuid)
returns void
language plpgsql
security definer
as $$
declare
  total_size bigint;
begin
  -- Calculate total size of user's ROMs in storage
  select coalesce(sum(file_size), 0) into total_size
  from user_library
  where user_id = user_id_param
    and storage_type = 'supabase'
    and download_status = 'completed';

  -- Upsert the quota record
  insert into user_storage_quotas (user_id, used_bytes, last_calculated_at)
  values (user_id_param, total_size, now())
  on conflict (user_id)
  do update set
    used_bytes = total_size,
    last_calculated_at = now();
end;
$$;

-- Function to search game catalog with filters
create or replace function search_game_catalog(
  search_query text default null,
  system_filter text default null,
  genre_filter text default null,
  region_filter text default null,
  series_filter text default null,
  sort_by text default 'title',
  sort_asc boolean default true,
  page_num integer default 0,
  page_size integer default 50
)
returns table(
  id uuid,
  myrient_path text,
  title text,
  system_id text,
  region text,
  languages text[],
  version text,
  file_size bigint,
  igdb_id integer,
  description text,
  genres text[],
  series text,
  release_date date,
  developer text,
  publisher text,
  cover_url text,
  igdb_rating numeric,
  total_count bigint
)
language plpgsql
security definer
as $$
declare
  total bigint;
begin
  -- Get total count first
  select count(*) into total
  from game_catalog gc
  where
    (search_query is null or gc.search_vector @@ websearch_to_tsquery('english', search_query))
    and (system_filter is null or gc.system_id = system_filter)
    and (genre_filter is null or genre_filter = any(gc.genres))
    and (region_filter is null or gc.region = region_filter)
    and (series_filter is null or gc.series = series_filter);

  return query
  select
    gc.id,
    gc.myrient_path,
    gc.title,
    gc.system_id,
    gc.region,
    gc.languages,
    gc.version,
    gc.file_size,
    gc.igdb_id,
    gc.description,
    gc.genres,
    gc.series,
    gc.release_date,
    gc.developer,
    gc.publisher,
    gc.cover_url,
    gc.igdb_rating,
    total as total_count
  from game_catalog gc
  where
    (search_query is null or gc.search_vector @@ websearch_to_tsquery('english', search_query))
    and (system_filter is null or gc.system_id = system_filter)
    and (genre_filter is null or genre_filter = any(gc.genres))
    and (region_filter is null or gc.region = region_filter)
    and (series_filter is null or gc.series = series_filter)
  order by
    case when sort_by = 'title' and sort_asc then gc.title end asc,
    case when sort_by = 'title' and not sort_asc then gc.title end desc,
    case when sort_by = 'release_date' and sort_asc then gc.release_date end asc nulls last,
    case when sort_by = 'release_date' and not sort_asc then gc.release_date end desc nulls last,
    case when sort_by = 'rating' and sort_asc then gc.igdb_rating end asc nulls last,
    case when sort_by = 'rating' and not sort_asc then gc.igdb_rating end desc nulls last
  limit page_size
  offset page_num * page_size;
end;
$$;
