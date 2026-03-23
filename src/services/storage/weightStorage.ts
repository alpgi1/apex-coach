import * as Crypto from 'expo-crypto';
import { WeightLog } from '../../types/weight.types';
import db from './database';

interface WeightLogRow {
    id: string;
    date: string;
    weightKg: number;
    notes: string | null;
    createdAt: string;
}

const toDateString = (d = new Date()): string =>
    d.toISOString().slice(0, 10); // "YYYY-MM-DD"

const rowToLog = (row: WeightLogRow): WeightLog => ({
    id: row.id,
    date: row.date,
    weightKg: row.weightKg,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
});

/** Upsert a weight entry for the given date (defaults to today). */
export const logWeight = async (
    weightKg: number,
    date?: string,
    notes?: string
): Promise<WeightLog> => {
    const now = new Date().toISOString();
    const entry: WeightLog = {
        id: Crypto.randomUUID(),
        date: date ?? toDateString(),
        weightKg,
        notes,
        createdAt: now,
    };

    // INSERT OR REPLACE — UNIQUE constraint on date handles the upsert
    await db.runAsync(
        `INSERT OR REPLACE INTO body_weight_logs (id, date, weightKg, notes, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        [entry.id, entry.date, entry.weightKg, entry.notes ?? null, entry.createdAt]
    );

    return entry;
};

/** All entries, newest first. */
export const getWeightHistory = async (): Promise<WeightLog[]> => {
    const rows = await db.getAllAsync<WeightLogRow>(
        `SELECT * FROM body_weight_logs ORDER BY date DESC`
    );
    return rows.map(rowToLog);
};

/** Last N days of entries, newest first. */
export const getWeightHistoryDays = async (days: number): Promise<WeightLog[]> => {
    const cutoff = toDateString(new Date(Date.now() - days * 86_400_000));
    const rows = await db.getAllAsync<WeightLogRow>(
        `SELECT * FROM body_weight_logs WHERE date >= ? ORDER BY date DESC`,
        [cutoff]
    );
    return rows.map(rowToLog);
};

/** Today's entry, or null if not logged yet. */
export const getTodayWeight = async (): Promise<WeightLog | null> => {
    const row = await db.getFirstAsync<WeightLogRow>(
        `SELECT * FROM body_weight_logs WHERE date = ?`,
        [toDateString()]
    );
    return row ? rowToLog(row) : null;
};

/** Sync entries fetched from backend into local SQLite (upsert by date). */
export const upsertWeightLogsFromBackend = async (
    logs: { date: string; weightKg: number; notes?: string | null }[]
): Promise<void> => {
    for (const l of logs) {
        await logWeight(l.weightKg, l.date, l.notes ?? undefined);
    }
};

export const deleteWeightLog = async (id: string): Promise<void> => {
    await db.runAsync(`DELETE FROM body_weight_logs WHERE id = ?`, [id]);
};

/**
 * Builds a compact weight context string for the AI system prompt.
 * Returns empty string if no data is available.
 */
export const buildWeightContextString = async (): Promise<string> => {
    const logs = await getWeightHistoryDays(30);
    if (logs.length === 0) return '';

    const latest = logs[0].weightKg;
    const oldest = logs[logs.length - 1].weightKg;
    const delta = latest - oldest;
    const direction = delta > 0.05 ? 'gained' : delta < -0.05 ? 'lost' : 'maintained';
    const absDelta = Math.abs(delta).toFixed(1);
    const minW = Math.min(...logs.map((l) => l.weightKg));
    const maxW = Math.max(...logs.map((l) => l.weightKg));

    return `Body weight (last ${logs.length} days): current ${latest}kg, ${direction} ${absDelta}kg. Range: ${minW}–${maxW}kg.`;
};
