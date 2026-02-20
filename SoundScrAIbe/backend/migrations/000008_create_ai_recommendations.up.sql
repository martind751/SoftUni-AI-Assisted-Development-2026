CREATE TABLE ai_recommendations (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode          TEXT NOT NULL CHECK (mode IN ('smart', 'prompt')),
    user_prompt   TEXT NOT NULL DEFAULT '',
    taste_summary TEXT NOT NULL DEFAULT '',
    results_json  JSONB NOT NULL DEFAULT '[]',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_recs_user ON ai_recommendations (user_id, created_at DESC);
