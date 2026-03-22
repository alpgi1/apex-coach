/* ─────────────────────────────────────────────────────────────
   Date helpers
───────────────────────────────────────────────────────────── */

export const isSameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

export const isToday = (d: Date): boolean => isSameDay(d, new Date());

/** Returns how many days ago an ISO date string is (fractional). */
export const daysAgo = (isoDate: string): number =>
    (Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000);

/** "Mar 22" — compact, no weekday */
export const formatDateShort = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** "Mar 22, 2026" — medium, with year */
export const formatDateMedium = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** "Mon, Mar 22" */
export const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

/** "Sunday, March 22, 2026" — for detail screens */
export const formatDateLong = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

/* ─────────────────────────────────────────────────────────────
   Duration helpers
───────────────────────────────────────────────────────────── */

/** "45m" or "1h 30m". Returns "--" if end is null. */
export const formatDuration = (start: string, end: string | null): string => {
    if (!end) return '--';
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

/** "05:30" countdown/timer display. */
export const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/* ─────────────────────────────────────────────────────────────
   Volume helpers
───────────────────────────────────────────────────────────── */

/** "1.2k" or "800". No unit suffix — callers add "kg" as needed. */
export const formatVolume = (kg: number): string =>
    kg >= 1000 ? `${(kg / 1000).toFixed(1)}k` : `${kg.toLocaleString()}`;

/* ─────────────────────────────────────────────────────────────
   RPE helpers
───────────────────────────────────────────────────────────── */

/** Returns a hex color for a given RPE value (for StyleSheet usage). */
export const getRpeHexColor = (rpe: number): string => {
    if (rpe <= 7) return '#4ade80';
    if (rpe <= 8.5) return '#facc15';
    return '#f87171';
};

/** Returns a NativeWind text className for a given RPE value. */
export const getRpeTextClass = (rpe: number | undefined): string => {
    if (rpe === undefined) return 'text-[#8E8E93]';
    if (rpe <= 7) return 'text-green-400';
    if (rpe <= 8.5) return 'text-yellow-400';
    return 'text-red-400';
};

/** Returns NativeWind bg+text classNames for RPE badge display. */
export const getRpeBadgeClass = (rpe: number | null): string => {
    if (rpe === null) return 'bg-white/10 text-[#8E8E93]';
    if (rpe <= 7) return 'bg-green-500/20 text-green-500';
    if (rpe <= 8.5) return 'bg-yellow-500/20 text-yellow-500';
    return 'bg-red-500/20 text-red-500';
};

/** Human-readable RPE label. */
export const getRpeLabel = (rpe: number): string => {
    if (rpe === 10) return 'Max effort — 0 RIR';
    if (rpe === 9.5) return 'Could maybe add weight';
    if (rpe === 9) return '1 rep in reserve';
    if (rpe === 8.5) return '1–2 reps in reserve';
    if (rpe === 8) return '2 reps in reserve';
    if (rpe === 7.5) return '2–3 reps in reserve';
    if (rpe === 7) return '3 reps in reserve';
    if (rpe === 6.5) return '3–4 reps in reserve';
    if (rpe === 6) return '4 reps in reserve';
    return 'Warm-up territory';
};
