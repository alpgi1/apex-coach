import { WorkoutSession } from '../../types/workout.types';
import { apiRequest } from './client';

interface CreateWorkoutSetRequest {
    setNumber: number;
    weightKg: number;
    reps: number;
    rpe: number | null;
    setType: string;
    restDurationSeconds: number | null;
    isCompleted: boolean;
}

interface CreateExerciseLogRequest {
    exerciseId: string;
    order: number;
    notes: string | null;
    sets: CreateWorkoutSetRequest[];
}

interface CreateWorkoutRequest {
    name: string;
    startTime: string;
    endTime: string | null;
    bodyweightKg: number | null;
    notes: string | null;
    logs: CreateExerciseLogRequest[];
}

const mapSessionToPayload = (session: WorkoutSession): CreateWorkoutRequest => ({
    name: session.name,
    startTime: session.startTime,
    endTime: session.endTime ?? null,
    bodyweightKg: session.bodyweightKg ?? null,
    notes: session.notes ?? null,
    logs: session.logs.map((log) => ({
        exerciseId: log.exerciseId,
        order: log.order,
        notes: log.notes ?? null,
        sets: log.sets.map((s) => ({
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps: s.reps,
            rpe: s.rpe ?? null,
            setType: s.setType,
            restDurationSeconds: s.restDurationSeconds ?? null,
            isCompleted: s.isCompleted,
        })),
    })),
});

export const postWorkout = async (session: WorkoutSession): Promise<void> => {
    const payload = mapSessionToPayload(session);
    await apiRequest<unknown>('POST', '/api/v1/workouts', payload);
};
