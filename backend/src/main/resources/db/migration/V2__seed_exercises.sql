-- ══════════════════════════════════════════════════════════
-- V2: Apex Coach — Seed Default Exercise Library
-- Mirrors the frontend exerciseStorage.ts seed data (30 exercises)
-- ══════════════════════════════════════════════════════════

INSERT INTO exercises (id, name, primary_muscle_group, primary_muscles, secondary_muscles, equipment, category, ideal_reps_min, ideal_reps_max, is_bilateral, is_custom) VALUES

-- ── CHEST ─────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000001', 'Barbell Bench Press',     'CHEST',     '{"UPPER_CHEST","MIDDLE_CHEST"}', '{"TRICEPS","FRONT_DELTS"}', 'BARBELL',    'COMPOUND',  4,  10, true,  false),
('a1000000-0000-0000-0000-000000000002', 'Incline Dumbbell Press',  'CHEST',     '{"UPPER_CHEST"}',               '{"TRICEPS","FRONT_DELTS"}', 'DUMBBELL',   'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000003', 'Cable Fly',               'CHEST',     '{"MIDDLE_CHEST","LOWER_CHEST"}','{"FRONT_DELTS"}',           'CABLE',      'ISOLATION', 10, 20, true,  false),
('a1000000-0000-0000-0000-000000000004', 'Dumbbell Fly',            'CHEST',     '{"MIDDLE_CHEST"}',              '{"FRONT_DELTS"}',           'DUMBBELL',   'ISOLATION', 10, 15, true,  false),
('a1000000-0000-0000-0000-000000000005', 'Push Up',                 'CHEST',     '{"MIDDLE_CHEST","UPPER_CHEST"}','{"TRICEPS","FRONT_DELTS"}', 'BODYWEIGHT', 'COMPOUND',  10, 30, true,  false),

-- ── BACK ──────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000006', 'Barbell Row',             'BACK',      '{"LATS","RHOMBOIDS","TRAPS"}',  '{"BICEPS","REAR_DELTS"}',   'BARBELL',    'COMPOUND',  4,  10, true,  false),
('a1000000-0000-0000-0000-000000000007', 'Pull Up',                 'BACK',      '{"LATS","RHOMBOIDS"}',          '{"BICEPS","REAR_DELTS"}',   'BODYWEIGHT', 'COMPOUND',  4,  12, true,  false),
('a1000000-0000-0000-0000-000000000008', 'Lat Pulldown',            'BACK',      '{"LATS"}',                      '{"BICEPS","REAR_DELTS"}',   'CABLE',      'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000009', 'Seated Cable Row',        'BACK',      '{"RHOMBOIDS","LATS","TRAPS"}',  '{"BICEPS","REAR_DELTS"}',   'CABLE',      'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000010', 'Deadlift',                'BACK',      '{"LOWER_BACK","TRAPS","LATS"}', '{"GLUTES","HAMSTRINGS","QUADS"}', 'BARBELL', 'COMPOUND', 3, 6,  true,  false),

-- ── LEGS ──────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000011', 'Barbell Squat',           'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","LOWER_BACK"}','BARBELL',   'COMPOUND',  4,  8,  true,  false),
('a1000000-0000-0000-0000-000000000012', 'Romanian Deadlift',       'LEGS',      '{"HAMSTRINGS","GLUTES"}',       '{"LOWER_BACK","CALVES"}',   'BARBELL',    'COMPOUND',  6,  12, true,  false),
('a1000000-0000-0000-0000-000000000013', 'Leg Press',               'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',   'MACHINE',    'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000014', 'Leg Curl',                'LEGS',      '{"HAMSTRINGS"}',                '{"GLUTES","CALVES"}',       'MACHINE',    'ISOLATION', 10, 15, false, false),
('a1000000-0000-0000-0000-000000000015', 'Leg Extension',           'LEGS',      '{"QUADS"}',                     '{}',                        'MACHINE',    'ISOLATION', 10, 20, true,  false),
('a1000000-0000-0000-0000-000000000016', 'Calf Raise',              'LEGS',      '{"CALVES"}',                    '{}',                        'MACHINE',    'ISOLATION', 12, 20, true,  false),
('a1000000-0000-0000-0000-000000000017', 'Bulgarian Split Squat',   'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',   'DUMBBELL',   'COMPOUND',  6,  12, false, false),

-- ── SHOULDERS ─────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000018', 'Overhead Press',          'SHOULDERS', '{"FRONT_DELTS","SIDE_DELTS"}',  '{"TRICEPS","TRAPS"}',       'BARBELL',    'COMPOUND',  4,  10, true,  false),
('a1000000-0000-0000-0000-000000000019', 'Dumbbell Lateral Raise',  'SHOULDERS', '{"SIDE_DELTS"}',                '{"TRAPS"}',                 'DUMBBELL',   'ISOLATION', 12, 20, true,  false),
('a1000000-0000-0000-0000-000000000020', 'Face Pull',               'SHOULDERS', '{"REAR_DELTS","TRAPS"}',        '{"RHOMBOIDS","BICEPS"}',    'CABLE',      'ISOLATION', 12, 20, true,  false),
('a1000000-0000-0000-0000-000000000021', 'Dumbbell Shoulder Press', 'SHOULDERS', '{"FRONT_DELTS","SIDE_DELTS"}',  '{"TRICEPS"}',               'DUMBBELL',   'COMPOUND',  8,  15, true,  false),

-- ── ARMS ──────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000022', 'Barbell Curl',            'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',              'BARBELL',    'ISOLATION', 8,  15, true,  false),
('a1000000-0000-0000-0000-000000000023', 'Dumbbell Curl',           'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',              'DUMBBELL',   'ISOLATION', 8,  15, false, false),
('a1000000-0000-0000-0000-000000000024', 'Tricep Pushdown',         'ARMS',      '{"TRICEPS"}',                   '{}',                        'CABLE',      'ISOLATION', 10, 20, true,  false),
('a1000000-0000-0000-0000-000000000025', 'Skull Crusher',           'ARMS',      '{"TRICEPS"}',                   '{}',                        'BARBELL',    'ISOLATION', 8,  15, true,  false),
('a1000000-0000-0000-0000-000000000026', 'Hammer Curl',             'ARMS',      '{"BICEPS","FOREARMS"}',         '{}',                        'DUMBBELL',   'ISOLATION', 10, 15, false, false),

-- ── CORE ──────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000027', 'Plank',                   'CORE',      '{"ABS","OBLIQUES"}',            '{"LOWER_BACK"}',            'BODYWEIGHT', 'ISOLATION', 1,  1,  true,  false),
('a1000000-0000-0000-0000-000000000028', 'Cable Crunch',            'CORE',      '{"ABS"}',                       '{"OBLIQUES"}',              'CABLE',      'ISOLATION', 12, 20, true,  false),
('a1000000-0000-0000-0000-000000000029', 'Hanging Leg Raise',       'CORE',      '{"ABS","HIP_FLEXORS"}',         '{"OBLIQUES"}',              'BODYWEIGHT', 'ISOLATION', 8,  15, true,  false),

-- ── FULL BODY ─────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000030', 'Power Clean',             'FULL_BODY', '{"TRAPS","GLUTES","QUADS"}',    '{"HAMSTRINGS","CALVES","FRONT_DELTS"}', 'BARBELL', 'COMPOUND', 3, 5, true, false);
