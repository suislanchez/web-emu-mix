-- PixelVault Storage Buckets
-- Storage for avatars, saves, and ROMs/ISOs

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Avatars bucket (public, for profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB max for avatars
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Saves bucket (private, for game save files)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'saves',
  'saves',
  false,
  52428800 -- 50MB max for save files
) ON CONFLICT (id) DO NOTHING;

-- User ROMs bucket (private, for uploaded ROMs and ISOs)
-- Large file limit for ISOs (up to 4.7GB for DVD, 700MB for CD, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'user_roms',
  'user_roms',
  false,
  5368709120 -- 5GB max per file (covers DVD ISOs)
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- AVATARS POLICIES
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- SAVES POLICIES
CREATE POLICY "Users can view own saves"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'saves' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own saves"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'saves' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own saves"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'saves' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own saves"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'saves' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- USER ROMS POLICIES
CREATE POLICY "Users can view own roms"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user_roms' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own roms"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user_roms' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own roms"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user_roms' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own roms"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user_roms' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
