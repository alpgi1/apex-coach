-- ══════════════════════════════════════════════════════════
-- V6: Apex Coach — Expand Exercise Library
-- Adds ~55 new exercises covering equipment variations
-- (barbell / dumbbell / machine / cable) for all main movements
-- ══════════════════════════════════════════════════════════

INSERT INTO exercises (id, name, primary_muscle_group, primary_muscles, secondary_muscles, equipment, category, ideal_reps_min, ideal_reps_max, is_bilateral, is_custom) VALUES

-- ── CHEST ─────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000031', 'Decline Barbell Press',            'CHEST',     '{"LOWER_CHEST","MIDDLE_CHEST"}', '{"TRICEPS","FRONT_DELTS"}',      'BARBELL',    'COMPOUND',  6,  12, true,  false),
('a1000000-0000-0000-0000-000000000032', 'Machine Chest Press',              'CHEST',     '{"MIDDLE_CHEST","UPPER_CHEST"}', '{"TRICEPS","FRONT_DELTS"}',      'MACHINE',    'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000033', 'Chest Dip',                        'CHEST',     '{"LOWER_CHEST","MIDDLE_CHEST"}', '{"TRICEPS","FRONT_DELTS"}',      'BODYWEIGHT', 'COMPOUND',  6,  15, true,  false),
('a1000000-0000-0000-0000-000000000034', 'Pec Deck',                         'CHEST',     '{"MIDDLE_CHEST"}',              '{"FRONT_DELTS"}',                'MACHINE',    'ISOLATION', 10, 20, true,  false),
('a1000000-0000-0000-0000-000000000035', 'Cable Crossover',                  'CHEST',     '{"MIDDLE_CHEST","LOWER_CHEST"}','{"FRONT_DELTS"}',                'CABLE',      'ISOLATION', 12, 20, true,  false),
('a1000000-0000-0000-0000-000000000036', 'Incline Barbell Press',            'CHEST',     '{"UPPER_CHEST"}',               '{"TRICEPS","FRONT_DELTS"}',      'BARBELL',    'COMPOUND',  5,  10, true,  false),
('a1000000-0000-0000-0000-000000000037', 'Dumbbell Bench Press',             'CHEST',     '{"MIDDLE_CHEST","UPPER_CHEST"}','{"TRICEPS","FRONT_DELTS"}',      'DUMBBELL',   'COMPOUND',  8,  15, true,  false),

-- ── BACK ──────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000038', 'One Arm Dumbbell Row',             'BACK',      '{"LATS","RHOMBOIDS"}',          '{"BICEPS","REAR_DELTS","TRAPS"}','DUMBBELL',   'COMPOUND',  8,  15, false, false),
('a1000000-0000-0000-0000-000000000039', 'T-Bar Row',                        'BACK',      '{"LATS","RHOMBOIDS","TRAPS"}',  '{"BICEPS","REAR_DELTS"}',        'BARBELL',    'COMPOUND',  6,  12, true,  false),
('a1000000-0000-0000-0000-000000000040', 'Chest Supported Row',              'BACK',      '{"RHOMBOIDS","LATS","TRAPS"}',  '{"BICEPS","REAR_DELTS"}',        'MACHINE',    'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000041', 'Pendlay Row',                      'BACK',      '{"LATS","RHOMBOIDS","TRAPS"}',  '{"BICEPS","REAR_DELTS"}',        'BARBELL',    'COMPOUND',  4,  8,  true,  false),
('a1000000-0000-0000-0000-000000000042', 'Chin Up',                          'BACK',      '{"LATS","RHOMBOIDS"}',          '{"BICEPS","REAR_DELTS"}',        'BODYWEIGHT', 'COMPOUND',  4,  12, true,  false),
('a1000000-0000-0000-0000-000000000043', 'Straight Arm Pulldown',            'BACK',      '{"LATS"}',                      '{"TRICEPS","REAR_DELTS"}',       'CABLE',      'ISOLATION', 10, 15, true,  false),
('a1000000-0000-0000-0000-000000000044', 'Hyperextension',                   'BACK',      '{"LOWER_BACK","GLUTES"}',       '{"HAMSTRINGS"}',                 'BODYWEIGHT', 'COMPOUND',  10, 20, true,  false),
('a1000000-0000-0000-0000-000000000045', 'Single Arm Cable Row',             'BACK',      '{"RHOMBOIDS","LATS"}',          '{"BICEPS","REAR_DELTS"}',        'CABLE',      'COMPOUND',  10, 15, false, false),
('a1000000-0000-0000-0000-000000000046', 'Machine Row',                      'BACK',      '{"RHOMBOIDS","LATS","TRAPS"}',  '{"BICEPS","REAR_DELTS"}',        'MACHINE',    'COMPOUND',  8,  15, true,  false),

-- ── LEGS ──────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000047', 'Front Squat',                      'LEGS',      '{"QUADS","GLUTES"}',            '{"ABS","LOWER_BACK"}',           'BARBELL',    'COMPOUND',  4,  8,  true,  false),
('a1000000-0000-0000-0000-000000000048', 'Goblet Squat',                     'LEGS',      '{"QUADS","GLUTES"}',            '{"ABS","HAMSTRINGS"}',           'DUMBBELL',   'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000049', 'Hack Squat',                       'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',        'MACHINE',    'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000050', 'Hip Thrust',                       'LEGS',      '{"GLUTES"}',                    '{"HAMSTRINGS","QUADS"}',         'BARBELL',    'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000051', 'Sumo Deadlift',                    'LEGS',      '{"GLUTES","HAMSTRINGS","QUADS"}','{"LOWER_BACK","TRAPS"}',        'BARBELL',    'COMPOUND',  3,  6,  true,  false),
('a1000000-0000-0000-0000-000000000052', 'Walking Lunge',                    'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',        'DUMBBELL',   'COMPOUND',  8,  16, false, false),
('a1000000-0000-0000-0000-000000000053', 'Seated Leg Curl',                  'LEGS',      '{"HAMSTRINGS"}',                '{"GLUTES","CALVES"}',            'MACHINE',    'ISOLATION', 10, 15, true,  false),
('a1000000-0000-0000-0000-000000000054', 'Standing Calf Raise',              'LEGS',      '{"CALVES"}',                    '{}',                             'MACHINE',    'ISOLATION', 12, 20, true,  false),
('a1000000-0000-0000-0000-000000000055', 'Glute Kickback',                   'LEGS',      '{"GLUTES"}',                    '{"HAMSTRINGS"}',                 'CABLE',      'ISOLATION', 12, 20, false, false),

-- ── SHOULDERS ─────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000056', 'Arnold Press',                     'SHOULDERS', '{"FRONT_DELTS","SIDE_DELTS"}',  '{"TRICEPS","REAR_DELTS"}',       'DUMBBELL',   'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000057', 'Machine Shoulder Press',           'SHOULDERS', '{"FRONT_DELTS","SIDE_DELTS"}',  '{"TRICEPS"}',                    'MACHINE',    'COMPOUND',  8,  15, true,  false),
('a1000000-0000-0000-0000-000000000058', 'Cable Lateral Raise',              'SHOULDERS', '{"SIDE_DELTS"}',                '{"TRAPS"}',                      'CABLE',      'ISOLATION', 12, 20, false, false),
('a1000000-0000-0000-0000-000000000059', 'Rear Delt Fly',                    'SHOULDERS', '{"REAR_DELTS"}',                '{"RHOMBOIDS","TRAPS"}',          'DUMBBELL',   'ISOLATION', 12, 20, true,  false),
('a1000000-0000-0000-0000-000000000060', 'Cable Rear Delt Fly',              'SHOULDERS', '{"REAR_DELTS"}',                '{"RHOMBOIDS","TRAPS"}',          'CABLE',      'ISOLATION', 12, 20, false, false),
('a1000000-0000-0000-0000-000000000061', 'Barbell Shrug',                    'SHOULDERS', '{"TRAPS"}',                     '{"FOREARMS"}',                   'BARBELL',    'ISOLATION', 8,  15, true,  false),
('a1000000-0000-0000-0000-000000000062', 'Dumbbell Shrug',                   'SHOULDERS', '{"TRAPS"}',                     '{"FOREARMS"}',                   'DUMBBELL',   'ISOLATION', 10, 15, true,  false),
('a1000000-0000-0000-0000-000000000063', 'Upright Row',                      'SHOULDERS', '{"SIDE_DELTS","TRAPS"}',        '{"BICEPS","FRONT_DELTS"}',       'BARBELL',    'COMPOUND',  8,  15, true,  false),

-- ── ARMS ──────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000064', 'Cable Curl',                       'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',                   'CABLE',      'ISOLATION', 10, 15, true,  false),
('a1000000-0000-0000-0000-000000000065', 'Preacher Curl',                    'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',                   'BARBELL',    'ISOLATION', 8,  12, true,  false),
('a1000000-0000-0000-0000-000000000066', 'Incline Dumbbell Curl',            'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',                   'DUMBBELL',   'ISOLATION', 10, 15, false, false),
('a1000000-0000-0000-0000-000000000067', 'Concentration Curl',               'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',                   'DUMBBELL',   'ISOLATION', 10, 15, false, false),
('a1000000-0000-0000-0000-000000000068', 'Overhead Cable Tricep Extension',  'ARMS',      '{"TRICEPS"}',                   '{}',                             'CABLE',      'ISOLATION', 10, 15, true,  false),
('a1000000-0000-0000-0000-000000000069', 'Dumbbell Overhead Tricep Extension','ARMS',     '{"TRICEPS"}',                   '{}',                             'DUMBBELL',   'ISOLATION', 10, 15, true,  false),
('a1000000-0000-0000-0000-000000000070', 'Tricep Kickback',                  'ARMS',      '{"TRICEPS"}',                   '{}',                             'DUMBBELL',   'ISOLATION', 12, 20, false, false),
('a1000000-0000-0000-0000-000000000071', 'Close-Grip Bench Press',           'ARMS',      '{"TRICEPS"}',                   '{"MIDDLE_CHEST","FRONT_DELTS"}', 'BARBELL',    'COMPOUND',  6,  12, true,  false),
('a1000000-0000-0000-0000-000000000072', 'EZ Bar Curl',                      'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',                   'BARBELL',    'ISOLATION', 8,  15, true,  false),
('a1000000-0000-0000-0000-000000000073', 'Dumbbell Tricep Kickback',         'ARMS',      '{"TRICEPS"}',                   '{}',                             'DUMBBELL',   'ISOLATION', 12, 20, false, false),

-- ── CORE ──────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000074', 'Russian Twist',                    'CORE',      '{"OBLIQUES"}',                  '{"ABS"}',                        'BODYWEIGHT', 'ISOLATION', 12, 20, true,  false),
('a1000000-0000-0000-0000-000000000075', 'Side Plank',                       'CORE',      '{"OBLIQUES"}',                  '{"ABS","LOWER_BACK"}',           'BODYWEIGHT', 'ISOLATION', 1,  1,  false, false),
('a1000000-0000-0000-0000-000000000076', 'Dead Bug',                         'CORE',      '{"ABS"}',                       '{"OBLIQUES","LOWER_BACK"}',      'BODYWEIGHT', 'ISOLATION', 8,  12, true,  false),
('a1000000-0000-0000-0000-000000000077', 'Decline Sit Up',                   'CORE',      '{"ABS"}',                       '{"HIP_FLEXORS"}',                'BODYWEIGHT', 'ISOLATION', 12, 20, true,  false),
('a1000000-0000-0000-0000-000000000078', 'Wood Chop',                        'CORE',      '{"OBLIQUES"}',                  '{"ABS","SHOULDERS"}',            'CABLE',      'ISOLATION', 12, 20, false, false),
('a1000000-0000-0000-0000-000000000079', 'Ab Wheel Rollout',                 'CORE',      '{"ABS"}',                       '{"OBLIQUES","LOWER_BACK"}',      'BODYWEIGHT', 'ISOLATION', 8,  15, true,  false),
('a1000000-0000-0000-0000-000000000080', 'Leg Raise',                        'CORE',      '{"ABS","HIP_FLEXORS"}',         '{"OBLIQUES"}',                   'BODYWEIGHT', 'ISOLATION', 10, 20, true,  false),

-- ── FULL BODY ─────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000081', 'Kettlebell Swing',                 'FULL_BODY', '{"GLUTES","HAMSTRINGS"}',       '{"LOWER_BACK","TRAPS","ABS"}',   'KETTLEBELL', 'COMPOUND',  10, 20, true,  false),
('a1000000-0000-0000-0000-000000000082', 'Farmer''s Walk',                   'FULL_BODY', '{"TRAPS","FOREARMS"}',          '{"ABS","GLUTES","CALVES"}',      'DUMBBELL',   'COMPOUND',  1,  1,  true,  false),
('a1000000-0000-0000-0000-000000000083', 'Thruster',                         'FULL_BODY', '{"QUADS","FRONT_DELTS","GLUTES"}','{"TRICEPS","ABS"}',            'BARBELL',    'COMPOUND',  5,  10, true,  false),
('a1000000-0000-0000-0000-000000000084', 'Barbell Clean and Press',          'FULL_BODY', '{"TRAPS","QUADS","FRONT_DELTS"}','{"GLUTES","HAMSTRINGS","TRICEPS"}','BARBELL',  'COMPOUND',  3,  6,  true,  false),
('a1000000-0000-0000-0000-000000000085', 'Burpee',                           'FULL_BODY', '{"QUADS","CHEST","GLUTES"}',    '{"ABS","TRICEPS","CALVES"}',     'BODYWEIGHT', 'COMPOUND',  8,  20, true,  false)

ON CONFLICT (id) DO NOTHING;
