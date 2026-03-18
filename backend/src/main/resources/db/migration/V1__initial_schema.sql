-- ══════════════════════════════════════════════════════════
-- V1: Apex Coach — Initial Database Schema
-- ══════════════════════════════════════════════════════════

-- ── ENUM TYPES ────────────────────────────────────────────

CREATE TYPE muscle_group AS ENUM (
    'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'FULL_BODY'
);

CREATE TYPE equipment_type AS ENUM (
    'BARBELL', 'DUMBBELL', 'KETTLEBELL', 'MACHINE', 'CABLE',
    'BODYWEIGHT', 'SMITH_MACHINE', 'OTHER'
);

CREATE TYPE exercise_category AS ENUM (
    'COMPOUND', 'ISOLATION', 'ACCESSORY'
);

CREATE TYPE set_type AS ENUM (
    'WARMUP', 'WORKING', 'DROP', 'FAILURE'
);

CREATE TYPE weight_unit AS ENUM (
    'KG', 'LBS'
);

-- ── USERS ─────────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_id     TEXT NOT NULL UNIQUE,
    email           TEXT NOT NULL UNIQUE,
    name            VARCHAR(50) NOT NULL,
    weight_unit     weight_unit NOT NULL DEFAULT 'KG',
    target_rir      INT NOT NULL DEFAULT 2,
    profile_photo_url TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_supabase_id ON users(supabase_id);

-- ── EXERCISES ─────────────────────────────────────────────

CREATE TABLE exercises (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(100) NOT NULL,
    primary_muscle_group muscle_group NOT NULL,
    primary_muscles      TEXT[] NOT NULL DEFAULT '{}',
    secondary_muscles    TEXT[] NOT NULL DEFAULT '{}',
    equipment            equipment_type NOT NULL,
    category             exercise_category NOT NULL,
    ideal_reps_min       INT NOT NULL DEFAULT 6,
    ideal_reps_max       INT NOT NULL DEFAULT 12,
    is_bilateral         BOOLEAN NOT NULL DEFAULT false,
    instructions         TEXT,
    video_url            TEXT,
    is_custom            BOOLEAN NOT NULL DEFAULT false,
    created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_muscle_group ON exercises(primary_muscle_group);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);

-- ── WORKOUT SESSIONS ──────────────────────────────────────

CREATE TABLE workout_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ,
    volume_kg       DECIMAL(10, 2) NOT NULL DEFAULT 0,
    bodyweight_kg   DECIMAL(5, 2),
    notes           TEXT,
    average_rpe     DECIMAL(3, 1),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_sessions_start_time ON workout_sessions(start_time DESC);

-- ── EXERCISE LOGS ─────────────────────────────────────────

CREATE TABLE exercise_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id  UUID NOT NULL REFERENCES exercises(id),
    sort_order   INT NOT NULL DEFAULT 0,
    notes        TEXT
);

CREATE INDEX idx_logs_session_id ON exercise_logs(session_id);
CREATE INDEX idx_logs_exercise_id ON exercise_logs(exercise_id);

-- ── WORKOUT SETS ──────────────────────────────────────────

CREATE TABLE workout_sets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_log_id     UUID NOT NULL REFERENCES exercise_logs(id) ON DELETE CASCADE,
    set_number          INT NOT NULL,
    weight_kg           DECIMAL(6, 2) NOT NULL DEFAULT 0,
    reps                INT NOT NULL DEFAULT 0,
    rpe                 DECIMAL(3, 1),
    set_type            set_type NOT NULL DEFAULT 'WORKING',
    rest_duration_seconds INT,
    is_completed        BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_sets_log_id ON workout_sets(exercise_log_id);

-- ── PERSONAL RECORDS ──────────────────────────────────────

CREATE TABLE personal_records (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id           UUID NOT NULL REFERENCES exercises(id),
    estimated_1rm         DECIMAL(6, 2),
    max_weight_kg         DECIMAL(6, 2),
    reps_at_max_weight    INT,
    max_reps              INT,
    weight_at_max_reps_kg DECIMAL(6, 2),
    max_session_volume_kg DECIMAL(10, 2),
    date_achieved         TIMESTAMPTZ,
    UNIQUE(user_id, exercise_id)
);

-- ── WORKOUT TEMPLATES ─────────────────────────────────────

CREATE TABLE workout_templates (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                  VARCHAR(100) NOT NULL,
    description           TEXT,
    primary_muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_templates_user_id ON workout_templates(user_id);

-- ── TEMPLATE EXERCISES ────────────────────────────────────

CREATE TABLE template_exercises (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id        UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id        UUID NOT NULL REFERENCES exercises(id),
    sort_order         INT NOT NULL DEFAULT 0,
    target_sets        INT NOT NULL DEFAULT 3,
    target_reps_min    INT NOT NULL DEFAULT 6,
    target_reps_max    INT,
    target_rpe         DECIMAL(3, 1),
    rest_target_seconds INT
);

CREATE INDEX idx_template_exercises_template_id ON template_exercises(template_id);
