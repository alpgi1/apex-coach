import { apiRequest } from './client';

export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface GenerateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  createdAt: string;
}

interface ApiDataResponse<T> {
  data: T;
}

export const generateApiKey = (name: string): Promise<ApiDataResponse<GenerateApiKeyResponse>> =>
  apiRequest('POST', '/api/v1/api-keys', { name });

export const listApiKeys = (): Promise<ApiDataResponse<ApiKeyResponse[]>> =>
  apiRequest('GET', '/api/v1/api-keys');

export const revokeApiKey = (id: string): Promise<void> =>
  apiRequest('DELETE', `/api/v1/api-keys/${id}`);
