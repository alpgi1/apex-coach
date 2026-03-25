/**
 * ExerciseDB API v1 client.
 * Base URL: https://exercisedb.dev/api/v1
 *
 * Provides paginated access to 1 300+ exercises with GIF demonstrations.
 */

const BASE = 'https://exercisedb.dev/api/v1';

/* ────────────────────────── types ──────────────────────────── */

export interface ExerciseDbItem {
    exerciseId: string;
    name: string;
    gifUrl: string;
    targetMuscles: string[];
    bodyParts: string[];
    equipments: string[];
    secondaryMuscles: string[];
    instructions: string[];
}

interface PaginationMeta {
    totalExercises: number;
    totalPages: number;
    currentPage: number;
    previousPage: string | null;
    nextPage: string | null;
}

interface ExerciseDbResponse {
    success: boolean;
    metadata: PaginationMeta;
    data: ExerciseDbItem[];
}

interface BodyPartEntry {
    name: string;
}

/* ────────────────────────── helpers ────────────────────────── */

async function get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ExerciseDB ${res.status}: ${res.statusText}`);
    return res.json() as Promise<T>;
}

/* ────────────────────────── endpoints ──────────────────────── */

/**
 * Fetch paginated exercises (default sort: name asc).
 */
export async function fetchExercises(
    offset = 0,
    limit = 10,
): Promise<ExerciseDbResponse> {
    return get<ExerciseDbResponse>(
        `${BASE}/exercises?offset=${offset}&limit=${limit}&sortBy=name&sortOrder=asc`,
    );
}

/**
 * Fuzzy search exercises across all fields.
 */
export async function searchExercisesDb(
    query: string,
    offset = 0,
    limit = 10,
): Promise<ExerciseDbResponse> {
    const q = encodeURIComponent(query);
    return get<ExerciseDbResponse>(
        `${BASE}/exercises/search?q=${q}&offset=${offset}&limit=${limit}`,
    );
}

/**
 * Get exercises filtered by body part name (case-insensitive).
 */
export async function fetchExercisesByBodyPart(
    bodyPart: string,
    offset = 0,
    limit = 10,
): Promise<ExerciseDbResponse> {
    const part = encodeURIComponent(bodyPart);
    return get<ExerciseDbResponse>(
        `${BASE}/bodyparts/${part}/exercises?offset=${offset}&limit=${limit}`,
    );
}

/**
 * Retrieve all available body part names for filter chips.
 */
export async function fetchBodyParts(): Promise<string[]> {
    const res = await get<{ success: boolean; data: BodyPartEntry[] }>(
        `${BASE}/bodyparts`,
    );
    return res.data.map((bp) => bp.name);
}
