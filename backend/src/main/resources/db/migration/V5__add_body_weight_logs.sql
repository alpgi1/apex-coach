CREATE TABLE body_weight_logs (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        DATE        NOT NULL,
    weight_kg   NUMERIC(5,2) NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_body_weight_user_date UNIQUE (user_id, date)
);

CREATE INDEX idx_body_weight_logs_user_date ON body_weight_logs(user_id, date DESC);
