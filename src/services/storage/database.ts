import * as SQLite from 'expo-sqlite';

/**
 * Open the database synchronously.
 * expo-sqlite SDK 50+ recommends synchronous connection initialization for better performance.
 */
const db = SQLite.openDatabaseSync('apex_coach.db');

/**
 * Initializes the entire offline-first database schema.
 * This should be called once when the application starts (e.g., in a root layout useEffect).
 */
export const initializeDatabase = () => {
    // We execute the statements synchronously to ensure the schema 
    // is fully loaded before any React components try to query it.
    db.execSync(`
        PRAGMA foreign_keys = ON;

        -- ==========================================
        -- EXERCISES
        -- ==========================================
        CREATE TABLE IF NOT EXISTS exercises (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            primaryMuscleGroup TEXT NOT NULL,
            primaryMuscles TEXT NOT NULL,     -- JSON array stored as string
            secondaryMuscles TEXT,            -- JSON array stored as string
            equipment TEXT NOT NULL,
            category TEXT NOT NULL,           -- 'COMPOUND', 'ISOLATION', etc.
            idealRepsMin INTEGER NOT NULL DEFAULT 5,
            idealRepsMax INTEGER NOT NULL DEFAULT 10,
            isBilateral INTEGER NOT NULL,     -- SQLite doesn't have native booleans (0 or 1)
            instructions TEXT,
            videoUrl TEXT,
            createdAt TEXT NOT NULL,          -- ISO 8601 string
            updatedAt TEXT NOT NULL,          -- ISO 8601 string
            isCustom INTEGER NOT NULL         -- 0 or 1
        );
        CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primaryMuscleGroup);

        -- ==========================================
        -- WORKOUT SESSIONS
        -- ==========================================
        CREATE TABLE IF NOT EXISTS workout_sessions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            startTime TEXT NOT NULL,          -- ISO 8601 string
            endTime TEXT,                     -- Nullable for active workouts
            volumeKg REAL NOT NULL DEFAULT 0,
            bodyweightKg REAL,
            notes TEXT,
            averageRPE REAL
        );
        CREATE INDEX IF NOT EXISTS idx_workout_sessions_start_time ON workout_sessions(startTime);

        -- ==========================================
        -- EXERCISE LOGS
        -- (A specific exercise performed within a session)
        -- ==========================================
        CREATE TABLE IF NOT EXISTS exercise_logs (
            id TEXT PRIMARY KEY,
            sessionId TEXT NOT NULL,
            exerciseId TEXT NOT NULL,
            "order" INTEGER NOT NULL,
            notes TEXT,
            FOREIGN KEY (sessionId) REFERENCES workout_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE RESTRICT
        );
        CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON exercise_logs(sessionId);
        CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise_id ON exercise_logs(exerciseId);

        -- ==========================================
        -- WORKOUT SETS
        -- (Individual attempts within an exercise log)
        -- ==========================================
        CREATE TABLE IF NOT EXISTS workout_sets (
            id TEXT PRIMARY KEY,
            exerciseLogId TEXT NOT NULL,
            setNumber INTEGER NOT NULL,
            weightKg REAL NOT NULL,
            reps INTEGER NOT NULL,
            rpe REAL,
            setType TEXT NOT NULL,            -- 'WARMUP', 'WORKING', 'DROP', 'FAILURE'
            restDurationSeconds INTEGER,
            isCompleted INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (exerciseLogId) REFERENCES exercise_logs(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_workout_sets_log_id ON workout_sets(exerciseLogId);

        -- ==========================================
        -- PERSONAL RECORDS
        -- (Snapshot of highest lifetime achievements per lift)
        -- ==========================================
        CREATE TABLE IF NOT EXISTS personal_records (
            exerciseId TEXT PRIMARY KEY,
            estimatedOneRepMax REAL NOT NULL,
            maxWeightKg REAL NOT NULL,
            repsAtMaxWeight INTEGER NOT NULL,
            maxReps INTEGER NOT NULL,
            weightAtMaxRepsKg REAL NOT NULL,
            maxSessionVolumeKg REAL NOT NULL,
            dateAchieved TEXT NOT NULL,       -- ISO 8601 string
            FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE
        );
    `);
};

export const clearAllData = (): void => {
    db.execSync(`
        DELETE FROM workout_sets;
        DELETE FROM exercise_logs;
        DELETE FROM workout_sessions;
        DELETE FROM personal_records;
    `);
};

export default db;
