import * as Crypto from 'expo-crypto';
import { ExerciseLog, RPEScale, SetType, WorkoutSession } from '../../types/workout.types';
import { WorkoutResponse } from '../api/workoutApi';
import db from './database';

interface WorkoutSessionRow {
    id: string;
    name: string;
    startTime: string;
    endTime: string | null;
    volumeKg: number;
    bodyweightKg: number | null;
    notes: string | null;
    averageRPE: number | null;
}

interface ExerciseLogRow {
    id: string;
    sessionId: string;
    exerciseId: string;
    order: number;
    notes: string | null;
}

interface WorkoutSetRow {
    id: string;
    exerciseLogId: string;
    setNumber: number;
    weightKg: number;
    reps: number;
    rpe: RPEScale | null;
    setType: SetType;
    restDurationSeconds: number | null;
    isCompleted: number;
}

const insertLogsAndSets = async (sessionId: string, logs: ExerciseLog[]): Promise<void> => {
    for (const log of logs) {
        await db.runAsync(
            `INSERT INTO exercise_logs (id, sessionId, exerciseId, "order", notes) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                log.id,
                sessionId,
                log.exerciseId,
                log.order,
                log.notes || null,
            ]
        );

        for (const set of log.sets) {
            await db.runAsync(
                `INSERT INTO workout_sets (id, exerciseLogId, setNumber, weightKg, reps, rpe, setType, restDurationSeconds, isCompleted) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    set.id,
                    log.id,
                    set.setNumber,
                    set.weightKg,
                    set.reps,
                    set.rpe ?? null,
                    set.setType,
                    set.restDurationSeconds ?? null,
                    set.isCompleted ? 1 : 0,
                ]
            );
        }
    }
};

export const saveWorkoutSession = async (session: WorkoutSession): Promise<void> => {
    await db.runAsync(
        `INSERT INTO workout_sessions (id, name, startTime, endTime, volumeKg, bodyweightKg, notes, averageRPE) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            session.id,
            session.name,
            session.startTime,
            session.endTime || null,
            session.volumeKg,
            session.bodyweightKg ?? null,
            session.notes || null,
            session.averageRPE ?? null,
        ]
    );

    await insertLogsAndSets(session.id, session.logs);
};

const attachLogsAndSets = async (sessionRow: WorkoutSessionRow): Promise<WorkoutSession> => {
    const logs = await db.getAllAsync<ExerciseLogRow>(
        `SELECT * FROM exercise_logs WHERE sessionId = ? ORDER BY "order" ASC`,
        [sessionRow.id]
    );

    const exerciseLogs: ExerciseLog[] = [];
    for (const logRow of logs) {
        const sets = await db.getAllAsync<WorkoutSetRow>(
            `SELECT * FROM workout_sets WHERE exerciseLogId = ? ORDER BY setNumber ASC`,
            [logRow.id]
        );

        exerciseLogs.push({
            id: logRow.id,
            exerciseId: logRow.exerciseId,
            order: logRow.order,
            notes: logRow.notes || undefined,
            sets: sets.map(setRow => ({
                id: setRow.id,
                setNumber: setRow.setNumber,
                weightKg: setRow.weightKg,
                reps: setRow.reps,
                rpe: setRow.rpe || undefined,
                setType: setRow.setType,
                restDurationSeconds: setRow.restDurationSeconds || undefined,
                isCompleted: setRow.isCompleted === 1
            }))
        });
    }

    return {
        id: sessionRow.id,
        name: sessionRow.name,
        startTime: sessionRow.startTime,
        endTime: sessionRow.endTime,
        volumeKg: sessionRow.volumeKg,
        bodyweightKg: sessionRow.bodyweightKg || undefined,
        notes: sessionRow.notes || undefined,
        averageRPE: sessionRow.averageRPE,
        logs: exerciseLogs
    };
};

export const getWorkoutHistory = async (): Promise<WorkoutSession[]> => {
    const sessions = await db.getAllAsync<WorkoutSessionRow>(
        `SELECT * FROM workout_sessions ORDER BY startTime DESC`
    );

    const history = await Promise.all(
        sessions.map(sessionRow => attachLogsAndSets(sessionRow))
    );

    return history;
};

export const getWorkoutSessionById = async (id: string): Promise<WorkoutSession | null> => {
    const sessionRow = await db.getFirstAsync<WorkoutSessionRow>(
        `SELECT * FROM workout_sessions WHERE id = ?`,
        [id]
    );

    if (!sessionRow) return null;

    return await attachLogsAndSets(sessionRow);
};

export const updateWorkoutSession = async (session: WorkoutSession): Promise<void> => {
    await db.runAsync(
        `UPDATE workout_sessions 
         SET name = ?, startTime = ?, endTime = ?, volumeKg = ?, bodyweightKg = ?, notes = ?, averageRPE = ?
         WHERE id = ?`,
        [
            session.name,
            session.startTime,
            session.endTime || null,
            session.volumeKg,
            session.bodyweightKg ?? null,
            session.notes || null,
            session.averageRPE ?? null,
            session.id,
        ]
    );

    await db.runAsync(`DELETE FROM exercise_logs WHERE sessionId = ?`, [session.id]);

    await insertLogsAndSets(session.id, session.logs);
};

export const syncWorkoutId = async (localId: string, backendId: string): Promise<void> => {
    if (localId === backendId) return;
    try {
        db.execSync('PRAGMA foreign_keys = OFF;');
        await db.runAsync(`UPDATE exercise_logs SET sessionId = ? WHERE sessionId = ?`, [backendId, localId]);
        await db.runAsync(`UPDATE workout_sessions SET id = ? WHERE id = ?`, [backendId, localId]);
    } finally {
        db.execSync('PRAGMA foreign_keys = ON;');
    }
};

export const deleteWorkoutSession = async (id: string): Promise<void> => {
    // Stamp as deleted FIRST — even if the DELETE below fails,
    // the sync will not re-insert this workout on the next launch.
    await db.runAsync(
        `INSERT OR IGNORE INTO deleted_workout_ids (id, deletedAt) VALUES (?, ?)`,
        [id, new Date().toISOString()]
    );
    await db.runAsync(`DELETE FROM workout_sessions WHERE id = ?`, [id]);
};

/** Remove duplicate workouts that share the same startTime (keeps the first inserted row). */
export const deduplicateWorkouts = async (): Promise<number> => {
    const dupes = await db.getAllAsync<{ startTime: string; cnt: number }>(
        `SELECT startTime, COUNT(*) as cnt FROM workout_sessions GROUP BY startTime HAVING cnt > 1`
    );
    let removed = 0;
    for (const { startTime } of dupes) {
        // Keep the first row (MIN rowid), delete the rest
        await db.runAsync(
            `DELETE FROM workout_sessions WHERE startTime = ? AND rowid NOT IN (
                SELECT MIN(rowid) FROM workout_sessions WHERE startTime = ?
            )`,
            [startTime, startTime]
        );
        removed++;
    }
    return removed;
};

export const upsertWorkoutsFromBackend = async (workouts: WorkoutResponse[]): Promise<void> => {
    for (const w of workouts) {
        // Skip workouts the user has explicitly deleted locally
        const isDeleted = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM deleted_workout_ids WHERE id = ?',
            [w.id]
        );
        if (isDeleted) continue;

        const existing = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM workout_sessions WHERE id = ? OR startTime = ?',
            [w.id, w.startTime]
        );
        if (existing) {
            if (existing.id !== w.id) {
                try {
                    db.execSync('PRAGMA foreign_keys = OFF;');
                    await db.runAsync(`UPDATE exercise_logs SET sessionId = ? WHERE sessionId = ?`, [w.id, existing.id]);
                    await db.runAsync(`UPDATE workout_sessions SET id = ? WHERE id = ?`, [w.id, existing.id]);
                } finally {
                    db.execSync('PRAGMA foreign_keys = ON;');
                }
            }
            continue;
        }

        await db.runAsync(
            `INSERT OR IGNORE INTO workout_sessions (id, name, startTime, endTime, volumeKg, bodyweightKg, notes, averageRPE)
             VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
            [w.id, w.name, w.startTime, w.endTime, w.volumeKg, w.averageRpe]
        );

        for (const log of w.logs) {
            await db.runAsync(
                `INSERT OR IGNORE INTO exercise_logs (id, sessionId, exerciseId, "order", notes)
                 VALUES (?, ?, ?, ?, NULL)`,
                [log.id, w.id, log.exerciseId, log.order]
            );
            for (const s of log.sets) {
                await db.runAsync(
                    `INSERT OR IGNORE INTO workout_sets (id, exerciseLogId, setNumber, weightKg, reps, rpe, setType, restDurationSeconds, isCompleted)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
                    [Crypto.randomUUID(), log.id, s.setNumber, s.weightKg, s.reps, s.rpe, s.setType, s.isCompleted ? 1 : 0]
                );
            }
        }
    }
};
