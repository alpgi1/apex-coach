export const Colors = {
    /* ── Brand ── */
    primary: '#FF6000',       // orange — buttons, accents, highlights
    ai: '#00C9A7',            // teal — AI coach, sparkles

    /* ── Semantic ── */
    danger: '#FF453A',        // delete, destructive actions
    warning: '#facc15',       // medium RPE, caution
    success: '#4ade80',       // low RPE, completed state

    /* ── Text ── */
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textMuted: 'rgba(255,255,255,0.3)',

    /* ── Surface ── */
    background: '#0A0A0A',
    card: 'rgba(255,255,255,0.04)',
    cardElevated: '#1C1C1E',

    /* ── Border ── */
    border: 'rgba(255,255,255,0.08)',
    borderSubtle: 'rgba(255,255,255,0.05)',

    /* ── RPE scale ── */
    rpe: {
        low: '#4ade80',       // ≤7
        medium: '#facc15',    // 7.5–8.5
        high: '#f87171',      // ≥9
    },
} as const;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const;

export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
} as const;
