/**
 * One-time migration that fetches exercise instructions from the free-exercise-db
 * open-source dataset and stores them in the local SQLite database.
 *
 * Matching strategy (three passes, first hit wins):
 *   1. Exact normalized match
 *   2. Source name starts with our normalized name (e.g. "Barbell Bench Press" → "Barbell Bench Press - Medium Grip")
 *   3. All our words present in source + Jaccard similarity ≥ 0.45
 *
 * Runs silently in the background on app startup. Once complete it sets
 * a flag in AsyncStorage so it never runs again.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllExercises, updateExerciseInstructions } from './exerciseStorage';

const MIGRATION_FLAG = '@apex_instructions_v2';
const SOURCE_URL =
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

interface FreeDbItem {
    name: string;
    instructions: string[];
}

function normalize(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
}

function wordSet(name: string): Set<string> {
    return new Set(normalize(name).split(/\s+/).filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
    let intersection = 0;
    for (const w of a) if (b.has(w)) intersection++;
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

function findBestMatch(localName: string, source: FreeDbItem[]): FreeDbItem | null {
    const ln = normalize(localName);
    const lw = wordSet(localName);

    // Pass 1: exact normalized match
    for (const item of source) {
        if (item.instructions?.length && normalize(item.name) === ln) return item;
    }

    // Pass 2: source name starts with our normalized name (handles "X - Variant" style names)
    const startsWith: Array<[number, FreeDbItem]> = [];
    for (const item of source) {
        if (!item.instructions?.length) continue;
        const sn = normalize(item.name);
        if (sn.startsWith(ln)) {
            startsWith.push([sn.length - ln.length, item]);
        }
    }
    if (startsWith.length > 0) {
        startsWith.sort((a, b) => a[0] - b[0]);
        return startsWith[0][1];
    }

    // Pass 3: all our words present in source, best Jaccard ≥ 0.45
    let best: FreeDbItem | null = null;
    let bestScore = 0.45;
    for (const item of source) {
        if (!item.instructions?.length) continue;
        const sw = wordSet(item.name);
        let allPresent = true;
        for (const w of lw) { if (!sw.has(w)) { allPresent = false; break; } }
        if (!allPresent) continue;
        const score = jaccard(lw, sw);
        if (score > bestScore) { bestScore = score; best = item; }
    }
    return best;
}

export async function runInstructionsMigration(): Promise<void> {
    try {
        const done = await AsyncStorage.getItem(MIGRATION_FLAG);
        if (done === 'true') return;

        const response = await fetch(SOURCE_URL);
        if (!response.ok) return;

        const source: FreeDbItem[] = await response.json();
        const localExercises = await getAllExercises();

        for (const ex of localExercises) {
            const match = findBestMatch(ex.name, source);
            if (match) {
                await updateExerciseInstructions(ex.id, match.instructions.join('\n\n'));
            }
        }

        await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
    } catch {
        // Silently fail — will retry on next app launch
    }
}
