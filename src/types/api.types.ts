import { ExerciseHistoryEntry, WorkoutSession } from './workout.types';

/**
 * Standard API Response Wrapper.
 * This should match the generic ResponseDTO coming from the Spring Boot backend.
 */
export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    message?: string;
    errors?: string[];
    timestamp: string; // ISO 8601
}

/**
 * Standard Pagination Metadata.
 * Mirrors Spring Data's `Page<T>` representation.
 */
export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalElements: number;
    hasNext: boolean;
}

/**
 * Paginated API Response Wrapper.
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: PaginationMeta;
}

/**
 * Payload sent to the backend to sync locally stored workouts.
 */
export interface SyncWorkoutsRequest {
    lastSyncTimestamp: string | null;  // When the client last synced successfully
    sessions: WorkoutSession[];        // Only the sessions modified since `lastSyncTimestamp`
}

export interface SyncWorkoutsResponse {
    syncedSessionIds: string[];        // IDs the backend successfully consumed
    conflicts: string[];               // IDs that had versioning conflicts
    nextSyncToken: string;             // New timestamp to save locally for the next sync
}

/**
 * Represents the context sent to the AI logic hook (and eventually the backend/LLM)
 * asking for advice on how to progress a specific exercise today.
 */
export interface AICoachProgressionRequest {
    exerciseId: string;
    // Summary of the last 3-6 sessions for this specific lift
    historicalPerformance: ExerciseHistoryEntry[];
    userTargetRir: number; // e.g., "I want to train at 2 Reps In Reserve today"
}

/**
 * The suggested progression output from the AI/Algorithm
 */
export interface AICoachProgressionResponse {
    exerciseId: string;
    suggestedWeightKg: number;
    suggestedRepsMin: number;
    suggestedRepsMax: number;
    confidenceScore: number;    // 0.0 to 1.0 (how sure the algorithm is)
    rationale: string;          // e.g., "RPE dropped to 7 on your last session. Increase weight by 2.5kg."
}
