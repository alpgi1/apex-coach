import db from '../storage/database';

interface BackendExercise {
    id: string;
    name: string;
    primaryMuscleGroup: string;
    primaryMuscles: string[];
    secondaryMuscles?: string[];
    equipment: string;
    category: string;
    idealRepsMin: number;
    idealRepsMax: number;
    isBilateral: boolean;
    gifUrl?: string;
}

interface BackendExercisesResponse {
    data: BackendExercise[];
}

/**
 * Fetches exercises from backend and updates local SQLite exercise IDs to match.
 * Matching is done by exercise name (case-insensitive).
 * Safe to call multiple times — idempotent.
 */
export const syncExercisesFromBackend = async (token: string): Promise<void> => {
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!apiUrl) return;

    let backendExercises: BackendExercise[];
    try {
        const res = await fetch(`${apiUrl}/api/v1/exercises`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json: BackendExercisesResponse = await res.json();
        backendExercises = json.data ?? [];
    } catch {
        // Offline or server down — skip silently
        return;
    }

    if (backendExercises.length === 0) return;

    // Build name → backendId lookup
    const nameToBackendId = new Map<string, string>();
    const nameToBackendExercise = new Map<string, BackendExercise>();
    for (const ex of backendExercises) {
        const key = ex.name.toLowerCase().trim();
        nameToBackendId.set(key, ex.id);
        nameToBackendExercise.set(key, ex);
    }

    // Fetch local exercises
    const localExercises = await db.getAllAsync<{ id: string; name: string }>(
        `SELECT id, name FROM exercises`
    );

    // Disable FK constraints for batch ID updates
    db.execSync('PRAGMA foreign_keys = OFF;');

    try {
        for (const local of localExercises) {
            const key = local.name.toLowerCase().trim();
            const backendId = nameToBackendId.get(key);

            if (!backendId || backendId === local.id) continue;

            const existing = await db.getFirstAsync<{ id: string }>(
                `SELECT id FROM exercises WHERE id = ?`, [backendId]
            );

            if (existing) {
                // backendId already in DB (leftover duplicate) — migrate FKs and delete the stale local row
                await db.runAsync(`UPDATE exercise_logs SET exerciseId = ? WHERE exerciseId = ?`, [backendId, local.id]);
                await db.runAsync(`UPDATE template_exercises SET exerciseId = ? WHERE exerciseId = ?`, [backendId, local.id]);
                await db.runAsync(`UPDATE personal_records SET exerciseId = ? WHERE exerciseId = ?`, [backendId, local.id]);
                await db.runAsync(`DELETE FROM exercises WHERE id = ?`, [local.id]);
            } else {
                // Normal case: rename local ID to backend ID
                await db.runAsync(`UPDATE exercise_logs SET exerciseId = ? WHERE exerciseId = ?`, [backendId, local.id]);
                await db.runAsync(`UPDATE template_exercises SET exerciseId = ? WHERE exerciseId = ?`, [backendId, local.id]);
                await db.runAsync(`UPDATE personal_records SET exerciseId = ? WHERE exerciseId = ?`, [backendId, local.id]);
                await db.runAsync(`UPDATE exercises SET id = ? WHERE id = ?`, [backendId, local.id]);
            }
        }

        // Insert backend exercises that don't exist locally
        const localNames = new Set(localExercises.map(e => e.name.toLowerCase().trim()));
        const now = new Date().toISOString();
        for (const ex of backendExercises) {
            if (localNames.has(ex.name.toLowerCase().trim())) continue;
            await db.runAsync(
                `INSERT OR IGNORE INTO exercises
                 (id, name, primaryMuscleGroup, primaryMuscles, secondaryMuscles,
                  equipment, category, idealRepsMin, idealRepsMax, isBilateral,
                  instructions, videoUrl, gifUrl, createdAt, updatedAt, isCustom)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, 0)`,
                [
                    ex.id,
                    ex.name,
                    ex.primaryMuscleGroup,
                    JSON.stringify(ex.primaryMuscles ?? []),
                    ex.secondaryMuscles ? JSON.stringify(ex.secondaryMuscles) : null,
                    ex.equipment,
                    ex.category,
                    ex.idealRepsMin,
                    ex.idealRepsMax,
                    ex.isBilateral ? 1 : 0,
                    ex.gifUrl ?? null,
                    now,
                    now,
                ]
            );
        }

        // Update gifUrl for existing exercises from backend data
        for (const ex of backendExercises) {
            if (!ex.gifUrl) continue;
            await db.runAsync(
                `UPDATE exercises SET gifUrl = ? WHERE id = ? AND (gifUrl IS NULL OR gifUrl != ?)`,
                [ex.gifUrl, ex.id, ex.gifUrl]
            );
        }

        // Remove non-custom local exercises that no longer exist in the backend
        const backendIds = new Set(backendExercises.map(e => e.id));
        const allLocal = await db.getAllAsync<{ id: string; isCustom: number }>(
            `SELECT id, isCustom FROM exercises`
        );
        for (const local of allLocal) {
            if (local.isCustom === 1) continue;          // Never delete user-created
            if (backendIds.has(local.id)) continue;      // Still in backend → keep
            try {
                await db.runAsync(`DELETE FROM exercises WHERE id = ?`, [local.id]);
            } catch {
                // FK constraint — exercise has workout history, leave it
            }
        }
    } finally {
        db.execSync('PRAGMA foreign_keys = ON;');
    }
};
