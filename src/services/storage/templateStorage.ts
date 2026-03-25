import * as Crypto from 'expo-crypto';
import { MuscleGroup } from '../../types/exercise.types';
import { RPEScale, TemplateExercise, WorkoutTemplate } from '../../types/workout.types';
import db from './database';

interface WorkoutTemplateRow {
    id: string;
    name: string;
    description: string | null;
    primaryMuscleGroups: string; // JSON array
    createdAt: string;
    updatedAt: string;
}

interface TemplateExerciseRow {
    id: string;
    templateId: string;
    exerciseId: string;
    order: number;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number | null;
    targetRpe: number | null;
    restTargetSeconds: number | null;
    targetWeightKg: number | null;
}

const mapRowToTemplateExercise = (row: TemplateExerciseRow): TemplateExercise => ({
    id: row.id,
    exerciseId: row.exerciseId,
    order: row.order,
    targetSets: row.targetSets,
    targetRepsMin: row.targetRepsMin,
    targetRepsMax: row.targetRepsMax ?? undefined,
    targetRpe: row.targetRpe != null ? (row.targetRpe as RPEScale) : undefined,
    restTargetSeconds: row.restTargetSeconds ?? undefined,
    targetWeightKg: row.targetWeightKg ?? undefined,
});

const mapRowToTemplate = (row: WorkoutTemplateRow, exercises: TemplateExercise[]): WorkoutTemplate => ({
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    exercises,
    primaryMuscleGroups: JSON.parse(row.primaryMuscleGroups) as MuscleGroup[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});

const attachTemplateExercises = async (templateId: string): Promise<TemplateExercise[]> => {
    const rows = await db.getAllAsync<TemplateExerciseRow>(
        `SELECT * FROM template_exercises WHERE templateId = ? ORDER BY "order" ASC`,
        [templateId]
    );
    return rows.map(mapRowToTemplateExercise);
};

export const saveTemplate = async (template: WorkoutTemplate): Promise<void> => {
    await db.runAsync(
        `INSERT INTO workout_templates (id, name, description, primaryMuscleGroups, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            template.id,
            template.name,
            template.description ?? null,
            JSON.stringify(template.primaryMuscleGroups),
            template.createdAt,
            template.updatedAt,
        ]
    );

    for (const ex of template.exercises) {
        await db.runAsync(
            `INSERT INTO template_exercises
                (id, templateId, exerciseId, "order", targetSets, targetRepsMin, targetRepsMax, targetRpe, restTargetSeconds, targetWeightKg)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ex.id,
                template.id,
                ex.exerciseId,
                ex.order,
                ex.targetSets,
                ex.targetRepsMin,
                ex.targetRepsMax ?? null,
                ex.targetRpe ?? null,
                ex.restTargetSeconds ?? null,
                ex.targetWeightKg ?? null,
            ]
        );
    }
};

export const getAllTemplates = async (): Promise<WorkoutTemplate[]> => {
    const rows = await db.getAllAsync<WorkoutTemplateRow>(
        `SELECT * FROM workout_templates ORDER BY name ASC`
    );
    return Promise.all(
        rows.map(async (row) => {
            const exercises = await attachTemplateExercises(row.id);
            return mapRowToTemplate(row, exercises);
        })
    );
};

export const getTemplateById = async (id: string): Promise<WorkoutTemplate | null> => {
    const row = await db.getFirstAsync<WorkoutTemplateRow>(
        `SELECT * FROM workout_templates WHERE id = ?`,
        [id]
    );
    if (!row) return null;
    const exercises = await attachTemplateExercises(row.id);
    return mapRowToTemplate(row, exercises);
};

export const deleteTemplate = async (id: string): Promise<void> => {
    await db.runAsync(`DELETE FROM workout_templates WHERE id = ?`, [id]);
};

export const updateTemplate = async (template: WorkoutTemplate): Promise<void> => {
    await db.runAsync(
        `UPDATE workout_templates
         SET name = ?, description = ?, primaryMuscleGroups = ?, updatedAt = ?
         WHERE id = ?`,
        [
            template.name,
            template.description ?? null,
            JSON.stringify(template.primaryMuscleGroups),
            template.updatedAt,
            template.id,
        ]
    );

    await db.runAsync(
        `DELETE FROM template_exercises WHERE templateId = ?`,
        [template.id]
    );

    for (const ex of template.exercises) {
        await db.runAsync(
            `INSERT INTO template_exercises
                (id, templateId, exerciseId, "order", targetSets, targetRepsMin, targetRepsMax, targetRpe, restTargetSeconds, targetWeightKg)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Crypto.randomUUID(),
                template.id,
                ex.exerciseId,
                ex.order,
                ex.targetSets,
                ex.targetRepsMin,
                ex.targetRepsMax ?? null,
                ex.targetRpe ?? null,
                ex.restTargetSeconds ?? null,
                ex.targetWeightKg ?? null,
            ]
        );
    }
};

// Backend returns 'sortOrder' but local uses 'order' — map before saving
interface BackendTemplateExercise {
    id: string;
    exerciseId: string;
    sortOrder: number;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax?: number;
    targetRpe?: number;
    restTargetSeconds?: number;
    targetWeightKg?: number;
}

interface BackendTemplate {
    id: string;
    name: string;
    description?: string;
    primaryMuscleGroups: string[];
    exercises: BackendTemplateExercise[];
    createdAt: string;
    updatedAt: string;
}

export const upsertTemplatesFromBackend = async (templates: BackendTemplate[]): Promise<void> => {
    for (const t of templates) {
        const existingById = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM workout_templates WHERE id = ?',
            [t.id]
        );
        if (existingById) continue;

        // Also skip if a template with the same name exists locally (local UUID ≠ backend UUID)
        const existingByName = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM workout_templates WHERE name = ?',
            [t.name]
        );
        if (existingByName) continue;

        const mapped: WorkoutTemplate = {
            id: t.id,
            name: t.name,
            description: t.description,
            primaryMuscleGroups: t.primaryMuscleGroups as MuscleGroup[],
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            exercises: t.exercises.map((e) => ({
                id: e.id,
                exerciseId: e.exerciseId,
                order: e.sortOrder,
                targetSets: e.targetSets,
                targetRepsMin: e.targetRepsMin,
                targetRepsMax: e.targetRepsMax,
                targetRpe: e.targetRpe as RPEScale | undefined,
                restTargetSeconds: e.restTargetSeconds,
                targetWeightKg: e.targetWeightKg,
            })),
        };

        await saveTemplate(mapped);
    }
};
