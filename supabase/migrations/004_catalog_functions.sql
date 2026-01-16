-- Game Catalog Search Functions

-- Search game catalog with filters and pagination
CREATE OR REPLACE FUNCTION search_game_catalog(
  search_query TEXT DEFAULT NULL,
  system_filter TEXT DEFAULT NULL,
  genre_filter TEXT DEFAULT NULL,
  region_filter TEXT DEFAULT NULL,
  series_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'title',
  sort_asc BOOLEAN DEFAULT TRUE,
  page_num INT DEFAULT 0,
  page_size INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  system_id TEXT,
  region TEXT,
  cover_url TEXT,
  myrient_path TEXT,
  genres TEXT[],
  description TEXT,
  release_year INT,
  publisher TEXT,
  developer TEXT,
  igdb_rating NUMERIC,
  file_size BIGINT,
  series TEXT,
  total_count BIGINT
) AS $$
DECLARE
  total BIGINT;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO total
  FROM game_catalog gc
  WHERE
    (search_query IS NULL OR search_query = '' OR
     gc.title ILIKE '%' || search_query || '%')
    AND (system_filter IS NULL OR gc.system_id = system_filter)
    AND (genre_filter IS NULL OR genre_filter = ANY(gc.genres))
    AND (region_filter IS NULL OR gc.region = region_filter)
    AND (series_filter IS NULL OR gc.series = series_filter);

  -- Return results with total count
  RETURN QUERY
  SELECT
    gc.id,
    gc.title,
    gc.system_id,
    gc.region,
    gc.cover_url,
    gc.myrient_path,
    gc.genres,
    gc.description,
    gc.release_year,
    gc.publisher,
    gc.developer,
    gc.igdb_rating,
    gc.file_size,
    gc.series,
    total AS total_count
  FROM game_catalog gc
  WHERE
    (search_query IS NULL OR search_query = '' OR
     gc.title ILIKE '%' || search_query || '%')
    AND (system_filter IS NULL OR gc.system_id = system_filter)
    AND (genre_filter IS NULL OR genre_filter = ANY(gc.genres))
    AND (region_filter IS NULL OR gc.region = region_filter)
    AND (series_filter IS NULL OR gc.series = series_filter)
  ORDER BY
    CASE WHEN sort_by = 'title' AND sort_asc THEN gc.title END ASC,
    CASE WHEN sort_by = 'title' AND NOT sort_asc THEN gc.title END DESC,
    CASE WHEN sort_by = 'release_date' AND sort_asc THEN gc.release_year END ASC NULLS LAST,
    CASE WHEN sort_by = 'release_date' AND NOT sort_asc THEN gc.release_year END DESC NULLS LAST,
    CASE WHEN sort_by = 'rating' AND sort_asc THEN gc.igdb_rating END ASC NULLS LAST,
    CASE WHEN sort_by = 'rating' AND NOT sort_asc THEN gc.igdb_rating END DESC NULLS LAST
  LIMIT page_size
  OFFSET page_num * page_size;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get distinct genres with counts
CREATE OR REPLACE FUNCTION get_distinct_genres()
RETURNS TABLE (genre TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT unnest(gc.genres) AS genre, COUNT(*) AS count
  FROM game_catalog gc
  WHERE gc.genres IS NOT NULL AND array_length(gc.genres, 1) > 0
  GROUP BY 1
  ORDER BY count DESC, genre ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get distinct series with counts
CREATE OR REPLACE FUNCTION get_distinct_series()
RETURNS TABLE (series TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT gc.series, COUNT(*) AS count
  FROM game_catalog gc
  WHERE gc.series IS NOT NULL AND gc.series != ''
  GROUP BY gc.series
  ORDER BY count DESC, series ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add missing columns to game_catalog if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'game_catalog' AND column_name = 'igdb_rating') THEN
    ALTER TABLE game_catalog ADD COLUMN igdb_rating NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'game_catalog' AND column_name = 'series') THEN
    ALTER TABLE game_catalog ADD COLUMN series TEXT;
  END IF;
END $$;

-- Create indexes for faster searching
CREATE INDEX IF NOT EXISTS idx_game_catalog_title_search ON game_catalog USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_game_catalog_genres ON game_catalog USING gin(genres);
CREATE INDEX IF NOT EXISTS idx_game_catalog_region ON game_catalog(region);
