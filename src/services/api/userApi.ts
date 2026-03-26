import { apiRequest } from './client';

export const deleteAccount = (): Promise<void> =>
    apiRequest('DELETE', '/api/v1/user/me');
