import { WorkoutTemplate } from '../../types/workout.types';
import { apiRequest } from './client';

interface ApiResponse<T> {
    data: T;
    message?: string;
}

// Backend DTO mapping (frontend 'order' → backend 'sortOrder')
const mapTemplateToBackend = (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => ({
    name: template.name,
    description: template.description ?? null,
    primaryMuscleGroups: template.primaryMuscleGroups,
    exercises: template.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        sortOrder: e.order,
        targetSets: e.targetSets,
        targetRepsMin: e.targetRepsMin,
        targetRepsMax: e.targetRepsMax ?? null,
        targetRpe: e.targetRpe ?? null,
        restTargetSeconds: e.restTargetSeconds ?? null,
    })),
});

export const fetchTemplates = (): Promise<ApiResponse<any[]>> =>
    apiRequest('GET', '/api/v1/templates');

export const createTemplate = (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<WorkoutTemplate>> =>
    apiRequest('POST', '/api/v1/templates', mapTemplateToBackend(template));

export const updateTemplate = (id: string, template: WorkoutTemplate): Promise<ApiResponse<WorkoutTemplate>> =>
    apiRequest('PUT', `/api/v1/templates/${id}`, mapTemplateToBackend(template));

export const deleteTemplate = (id: string): Promise<ApiResponse<void>> =>
    apiRequest('DELETE', `/api/v1/templates/${id}`);
