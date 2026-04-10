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

export const postWorkout = async (session: WorkoutSession): Promise<WorkoutResponse> => {
    const payload = mapSessionToPayload(session);
    return apiRequest<WorkoutResponse>('POST', '/api/v1/workouts', payload);
};

// ── Read-side types & fetch ──────────────────────────

interface WorkoutSetResponse {
    setNumber: number;
    weightKg: number;
    reps: number;
    rpe: number | null;
    setType: string;
    isCompleted: boolean;
}

interface ExerciseLogResponse {
    id: string;
    exerciseId: string;
    exerciseName: string;
    order: number;
    sets: WorkoutSetResponse[];
}

export interface WorkoutResponse {
    id: string;
    name: string;
    startTime: string;
    endTime: string | null;
    volumeKg: number;
    averageRpe: number | null;
    logs: ExerciseLogResponse[];
}

interface ApiPageResponse<T> {
    data: { content: T[] };
}

export const fetchWorkouts = (page = 0, size = 100): Promise<ApiPageResponse<WorkoutResponse>> =>
    apiRequest('GET', `/api/v1/workouts?page=${page}&size=${size}`);

export const deleteWorkoutFromBackend = (id: string): Promise<void> =>
    apiRequest('DELETE', `/api/v1/workouts/${id}`);
