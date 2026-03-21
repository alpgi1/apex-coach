import { apiRequest } from './client';

interface ApiResponse<T> {
    data: T;
}

export interface BackendPersonalRecord {
    exerciseId: string;
    exerciseName: string;
    maxWeightKg: number;
    repsAtMaxWeight: number;
    estimated1rm: number;
}

export const fetchAllRecords = (): Promise<ApiResponse<BackendPersonalRecord[]>> =>
    apiRequest('GET', '/api/v1/records');
