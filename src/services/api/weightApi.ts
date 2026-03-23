import { apiRequest } from './client';

interface BodyWeightLogResponse {
    id: string;
    date: string;       // "YYYY-MM-DD"
    weightKg: number;
    notes: string | null;
}

interface ApiBodyWeightResponse {
    data: BodyWeightLogResponse;
}

interface ApiBodyWeightListResponse {
    data: BodyWeightLogResponse[];
}

export const postBodyWeight = (
    date: string,
    weightKg: number,
    notes?: string
): Promise<ApiBodyWeightResponse> =>
    apiRequest('POST', '/api/v1/body-weight', { date, weightKg, notes });

export const fetchBodyWeights = (): Promise<ApiBodyWeightListResponse> =>
    apiRequest('GET', '/api/v1/body-weight');
