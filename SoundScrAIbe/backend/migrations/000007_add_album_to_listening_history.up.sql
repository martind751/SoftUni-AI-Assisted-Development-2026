ALTER TABLE listening_history ADD COLUMN album_id TEXT NOT NULL DEFAULT '';
ALTER TABLE listening_history ADD COLUMN album_name TEXT NOT NULL DEFAULT '';

CREATE INDEX idx_lh_user_album ON listening_history (user_id, album_id);
CREATE INDEX idx_lh_user_track ON listening_history (user_id, track_id);
