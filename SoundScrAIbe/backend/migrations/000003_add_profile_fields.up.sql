ALTER TABLE users
    ADD COLUMN email          TEXT NOT NULL DEFAULT '',
    ADD COLUMN country        TEXT NOT NULL DEFAULT '',
    ADD COLUMN product        TEXT NOT NULL DEFAULT '',
    ADD COLUMN follower_count INTEGER NOT NULL DEFAULT 0;
