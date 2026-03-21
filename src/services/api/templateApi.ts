import { WorkoutTemplate } from '../../types/workout.types';
import { apiRequest } from './client';

interface ApiResponse<T> {
    data: T;
    message?: string;
}

export const fetchTemplates = (): Promise<ApiResponse<WorkoutTemplate[]>> =>
    apiRequest('GET', '/api/v1/templates');

export const createTemplate = (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<WorkoutTemplate>> =>
    apiRequest('POST', '/api/v1/templates', template);

export const updateTemplate = (id: string, template: Partial<WorkoutTemplate>): Promise<ApiResponse<WorkoutTemplate>> =>
    apiRequest('PUT', `/api/v1/templates/${id}`, template);

export const deleteTemplate = (id: string): Promise<ApiResponse<void>> =>
    apiRequest('DELETE', `/api/v1/templates/${id}`);
