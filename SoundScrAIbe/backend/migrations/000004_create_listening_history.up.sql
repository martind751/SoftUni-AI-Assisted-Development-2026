CREATE TABLE listening_history (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id         TEXT NOT NULL,
    track_name       TEXT NOT NULL,
    artist_id        TEXT NOT NULL,
    artist_name      TEXT NOT NULL,
    duration_ms      INTEGER NOT NULL,
    played_at        TIMESTAMPTZ NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_listening_history UNIQUE (user_id, track_id, artist_id, played_at)
);

CREATE INDEX idx_lh_user_played ON listening_history (user_id, played_at DESC);
CREATE INDEX idx_lh_user_artist ON listening_history (user_id, artist_id);
