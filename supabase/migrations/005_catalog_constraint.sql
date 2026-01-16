-- Add unique constraint for game catalog upserts
-- Using NULLS NOT DISTINCT to handle NULL region values

ALTER TABLE game_catalog
DROP CONSTRAINT IF EXISTS game_catalog_unique_game;

ALTER TABLE game_catalog
ADD CONSTRAINT game_catalog_unique_game
UNIQUE NULLS NOT DISTINCT (title, system_id, region);
