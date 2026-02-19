CREATE TABLE ratings (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('track', 'album', 'artist')),
    entity_id   TEXT NOT NULL,
    score       INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_rating UNIQUE (user_id, entity_type, entity_id)
);
CREATE INDEX idx_ratings_user ON ratings (user_id);
CREATE INDEX idx_ratings_entity ON ratings (entity_type, entity_id);

CREATE TABLE shelves (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('track', 'album', 'artist')),
    entity_id   TEXT NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('listened', 'currently_listening', 'want_to_listen')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_shelf UNIQUE (user_id, entity_type, entity_id)
);
CREATE INDEX idx_shelves_user ON shelves (user_id);
CREATE INDEX idx_shelves_user_status ON shelves (user_id, status);

CREATE TABLE tags (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tag UNIQUE (user_id, name)
);
CREATE INDEX idx_tags_user ON tags (user_id);

CREATE TABLE item_tags (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('track', 'album', 'artist')),
    entity_id   TEXT NOT NULL,
    tag_id      BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_item_tag UNIQUE (user_id, entity_type, entity_id, tag_id)
);
CREATE INDEX idx_item_tags_entity ON item_tags (user_id, entity_type, entity_id);
CREATE INDEX idx_item_tags_tag ON item_tags (tag_id);

CREATE TABLE entity_metadata (
    id          BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('track', 'album', 'artist')),
    entity_id   TEXT NOT NULL,
    name        TEXT NOT NULL,
    image_url   TEXT NOT NULL DEFAULT '',
    extra_json  JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_entity_meta UNIQUE (entity_type, entity_id)
);
