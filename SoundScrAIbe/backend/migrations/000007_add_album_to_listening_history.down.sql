DROP INDEX IF EXISTS idx_lh_user_track;
DROP INDEX IF EXISTS idx_lh_user_album;
ALTER TABLE listening_history DROP COLUMN album_name;
ALTER TABLE listening_history DROP COLUMN album_id;
