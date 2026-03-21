import { useAuthStore } from '../../store/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const apiRequest = async <T>(
    method: HttpMethod,
    path: string,
    body?: unknown
): Promise<T> => {
    const token = useAuthStore.getState().session?.access_token;

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => res.status.toString());
        throw new Error(`${method} ${path} → ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
};
