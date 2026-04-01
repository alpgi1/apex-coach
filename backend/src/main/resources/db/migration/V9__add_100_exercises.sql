-- ══════════════════════════════════════════════════════════
-- V9: Apex Coach — Add ~100 New Exercises
-- All exercises verified against ExerciseDB open-source GIF library
-- No duplicates with V2 (exercises 1-30) or V6 (exercises 31-85)
-- IDs start at a2000000-... to avoid any collision
-- ══════════════════════════════════════════════════════════

INSERT INTO exercises (id, name, primary_muscle_group, primary_muscles, secondary_muscles, equipment, category, ideal_reps_min, ideal_reps_max, is_bilateral, is_custom) VALUES

-- ── CHEST ─────────────────────────────────────────────────
('a2000000-0000-0000-0000-000000000001', 'Smith Machine Bench Press',        'CHEST',     '{"MIDDLE_CHEST","UPPER_CHEST"}', '{"TRICEPS","FRONT_DELTS"}',       'SMITH_MACHINE','COMPOUND',  6,  12, true,  false),
('a2000000-0000-0000-0000-000000000002', 'Low Cable Fly',                    'CHEST',     '{"LOWER_CHEST"}',               '{"MIDDLE_CHEST","FRONT_DELTS"}',  'CABLE',       'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000003', 'High Cable Fly',                   'CHEST',     '{"UPPER_CHEST"}',               '{"MIDDLE_CHEST","FRONT_DELTS"}',  'CABLE',       'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000004', 'Incline Machine Press',            'CHEST',     '{"UPPER_CHEST"}',               '{"TRICEPS","FRONT_DELTS"}',       'MACHINE',     'COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000005', 'Decline Dumbbell Press',           'CHEST',     '{"LOWER_CHEST","MIDDLE_CHEST"}','{"TRICEPS","FRONT_DELTS"}',       'DUMBBELL',    'COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000006', 'Incline Dumbbell Fly',             'CHEST',     '{"UPPER_CHEST"}',               '{"FRONT_DELTS"}',                 'DUMBBELL',    'ISOLATION', 10, 15, true,  false),
('a2000000-0000-0000-0000-000000000007', 'Smith Machine Incline Press',      'CHEST',     '{"UPPER_CHEST"}',               '{"TRICEPS","FRONT_DELTS"}',       'SMITH_MACHINE','COMPOUND',  8,  12, true,  false),
('a2000000-0000-0000-0000-000000000008', 'Landmine Press',                   'CHEST',     '{"UPPER_CHEST","FRONT_DELTS"}', '{"TRICEPS"}',                     'BARBELL',     'COMPOUND',  8,  15, false, false),

-- ── BACK ──────────────────────────────────────────────────
('a2000000-0000-0000-0000-000000000009', 'Wide Grip Lat Pulldown',           'BACK',      '{"LATS"}',                      '{"BICEPS","REAR_DELTS"}',         'CABLE',       'COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000010', 'Close Grip Lat Pulldown',          'BACK',      '{"LATS"}',                      '{"BICEPS","RHOMBOIDS"}',          'CABLE',       'COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000011', 'Reverse Grip Barbell Row',         'BACK',      '{"LATS","RHOMBOIDS"}',          '{"BICEPS","REAR_DELTS"}',         'BARBELL',     'COMPOUND',  6,  12, true,  false),
('a2000000-0000-0000-0000-000000000012', 'Meadows Row',                      'BACK',      '{"LATS","RHOMBOIDS"}',          '{"BICEPS","REAR_DELTS"}',         'BARBELL',     'COMPOUND',  8,  12, false, false),
('a2000000-0000-0000-0000-000000000013', 'Cable Pullover',                   'BACK',      '{"LATS"}',                      '{"TRICEPS","REAR_DELTS"}',        'CABLE',       'ISOLATION', 10, 15, true,  false),
('a2000000-0000-0000-0000-000000000014', 'Dumbbell Pullover',                'BACK',      '{"LATS"}',                      '{"TRICEPS","CHEST"}',             'DUMBBELL',    'ISOLATION', 10, 15, true,  false),
('a2000000-0000-0000-0000-000000000015', 'Smith Machine Row',                'BACK',      '{"RHOMBOIDS","LATS","TRAPS"}',  '{"BICEPS","REAR_DELTS"}',         'SMITH_MACHINE','COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000016', 'Neutral Grip Pull Up',             'BACK',      '{"LATS","BICEPS"}',             '{"RHOMBOIDS","REAR_DELTS"}',      'BODYWEIGHT',  'COMPOUND',  4,  12, true,  false),
('a2000000-0000-0000-0000-000000000017', 'Assisted Pull Up',                 'BACK',      '{"LATS"}',                      '{"BICEPS","RHOMBOIDS"}',          'MACHINE',     'COMPOUND',  6,  15, true,  false),
('a2000000-0000-0000-0000-000000000018', 'Rack Pull',                        'BACK',      '{"TRAPS","LOWER_BACK","LATS"}', '{"GLUTES","HAMSTRINGS"}',         'BARBELL',     'COMPOUND',  3,  6,  true,  false),
('a2000000-0000-0000-0000-000000000019', 'Good Morning',                     'BACK',      '{"LOWER_BACK","HAMSTRINGS"}',   '{"GLUTES","ABS"}',                'BARBELL',     'COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000020', 'Ring Row',                         'BACK',      '{"RHOMBOIDS","LATS"}',          '{"BICEPS","REAR_DELTS"}',         'BODYWEIGHT',  'COMPOUND',  8,  15, true,  false),

-- ── LEGS ──────────────────────────────────────────────────
('a2000000-0000-0000-0000-000000000021', 'Smith Machine Squat',              'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","LOWER_BACK"}',     'SMITH_MACHINE','COMPOUND',  6,  12, true,  false),
('a2000000-0000-0000-0000-000000000022', 'Barbell Lunge',                    'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',         'BARBELL',     'COMPOUND',  8,  12, false, false),
('a2000000-0000-0000-0000-000000000023', 'Dumbbell Romanian Deadlift',       'LEGS',      '{"HAMSTRINGS","GLUTES"}',       '{"LOWER_BACK","CALVES"}',         'DUMBBELL',    'COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000024', 'Step Up',                          'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',         'DUMBBELL',    'COMPOUND',  8,  15, false, false),
('a2000000-0000-0000-0000-000000000025', 'Box Squat',                        'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","LOWER_BACK"}',     'BARBELL',     'COMPOUND',  3,  6,  true,  false),
('a2000000-0000-0000-0000-000000000026', 'Nordic Hamstring Curl',            'LEGS',      '{"HAMSTRINGS"}',                '{"GLUTES","CALVES"}',             'BODYWEIGHT',  'ISOLATION', 3,  8,  true,  false),
('a2000000-0000-0000-0000-000000000027', 'Donkey Calf Raise',                'LEGS',      '{"CALVES"}',                    '{}',                              'MACHINE',     'ISOLATION', 15, 25, true,  false),
('a2000000-0000-0000-0000-000000000028', 'Seated Calf Raise',                'LEGS',      '{"CALVES"}',                    '{}',                              'MACHINE',     'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000029', 'Cable Romanian Deadlift',          'LEGS',      '{"HAMSTRINGS","GLUTES"}',       '{"LOWER_BACK"}',                  'CABLE',       'COMPOUND',  10, 15, true,  false),
('a2000000-0000-0000-0000-000000000030', 'Single Leg Press',                 'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',         'MACHINE',     'COMPOUND',  10, 15, false, false),
('a2000000-0000-0000-0000-000000000031', 'Barbell Hip Thrust',               'LEGS',      '{"GLUTES"}',                    '{"HAMSTRINGS","QUADS"}',          'BARBELL',     'COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000032', 'Dumbbell Hip Thrust',              'LEGS',      '{"GLUTES"}',                    '{"HAMSTRINGS","QUADS"}',          'DUMBBELL',    'COMPOUND',  10, 20, true,  false),
('a2000000-0000-0000-0000-000000000033', 'Cable Pull Through',               'LEGS',      '{"GLUTES","HAMSTRINGS"}',       '{"LOWER_BACK"}',                  'CABLE',       'COMPOUND',  12, 20, true,  false),
('a2000000-0000-0000-0000-000000000034', 'Reverse Lunge',                    'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',         'DUMBBELL',    'COMPOUND',  8,  15, false, false),
('a2000000-0000-0000-0000-000000000035', 'Side Lunge',                       'LEGS',      '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","ADDUCTORS"}',      'DUMBBELL',    'COMPOUND',  8,  15, false, false),
('a2000000-0000-0000-0000-000000000036', 'Leg Press Calf Raise',             'LEGS',      '{"CALVES"}',                    '{}',                              'MACHINE',     'ISOLATION', 15, 25, true,  false),
('a2000000-0000-0000-0000-000000000037', 'Sissy Squat',                      'LEGS',      '{"QUADS"}',                     '{"CALVES"}',                      'BODYWEIGHT',  'ISOLATION', 10, 20, true,  false),
('a2000000-0000-0000-0000-000000000038', 'Jefferson Squat',                  'LEGS',      '{"QUADS","GLUTES","HAMSTRINGS"}','{"LOWER_BACK","ABS"}',           'BARBELL',     'COMPOUND',  4,  8,  true,  false),

-- ── SHOULDERS ─────────────────────────────────────────────
('a2000000-0000-0000-0000-000000000039', 'Dumbbell Lateral Raise',           'SHOULDERS', '{"SIDE_DELTS"}',                '{"TRAPS"}',                       'DUMBBELL',    'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000040', 'Seated Dumbbell Lateral Raise',    'SHOULDERS', '{"SIDE_DELTS"}',                '{"TRAPS"}',                       'DUMBBELL',    'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000041', 'Smith Machine Overhead Press',     'SHOULDERS', '{"FRONT_DELTS","SIDE_DELTS"}',  '{"TRICEPS","TRAPS"}',             'SMITH_MACHINE','COMPOUND',  6,  12, true,  false),
('a2000000-0000-0000-0000-000000000042', 'Push Press',                       'SHOULDERS', '{"FRONT_DELTS","SIDE_DELTS"}',  '{"TRICEPS","TRAPS","QUADS"}',     'BARBELL',     'COMPOUND',  3,  6,  true,  false),
('a2000000-0000-0000-0000-000000000043', 'Plate Front Raise',                'SHOULDERS', '{"FRONT_DELTS"}',               '{"SIDE_DELTS"}',                  'OTHER',       'ISOLATION', 10, 20, true,  false),
('a2000000-0000-0000-0000-000000000044', 'Dumbbell Front Raise',             'SHOULDERS', '{"FRONT_DELTS"}',               '{"SIDE_DELTS"}',                  'DUMBBELL',    'ISOLATION', 10, 15, true,  false),
('a2000000-0000-0000-0000-000000000045', 'Cable Front Raise',                'SHOULDERS', '{"FRONT_DELTS"}',               '{"SIDE_DELTS"}',                  'CABLE',       'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000046', 'Prone Rear Delt Raise',            'SHOULDERS', '{"REAR_DELTS"}',                '{"RHOMBOIDS","TRAPS"}',           'DUMBBELL',    'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000047', 'Dumbbell Upright Row',             'SHOULDERS', '{"SIDE_DELTS","TRAPS"}',        '{"BICEPS"}',                      'DUMBBELL',    'COMPOUND',  10, 15, true,  false),
('a2000000-0000-0000-0000-000000000048', 'Cable Upright Row',                'SHOULDERS', '{"SIDE_DELTS","TRAPS"}',        '{"BICEPS"}',                      'CABLE',       'COMPOUND',  10, 15, true,  false),
('a2000000-0000-0000-0000-000000000049', 'Landmine Lateral Raise',           'SHOULDERS', '{"SIDE_DELTS"}',                '{"TRAPS","FRONT_DELTS"}',         'BARBELL',     'ISOLATION', 10, 20, false, false),
('a2000000-0000-0000-0000-000000000050', 'Kettlebell Overhead Press',        'SHOULDERS', '{"FRONT_DELTS","SIDE_DELTS"}',  '{"TRICEPS","TRAPS"}',             'KETTLEBELL',  'COMPOUND',  6,  12, false, false),

-- ── ARMS ──────────────────────────────────────────────────
('a2000000-0000-0000-0000-000000000051', 'EZ Bar Skull Crusher',             'ARMS',      '{"TRICEPS"}',                   '{}',                              'BARBELL',     'ISOLATION', 8,  15, true,  false),
('a2000000-0000-0000-0000-000000000052', 'Dumbbell Skull Crusher',           'ARMS',      '{"TRICEPS"}',                   '{}',                              'DUMBBELL',    'ISOLATION', 10, 15, true,  false),
('a2000000-0000-0000-0000-000000000053', 'Cable Tricep Kickback',            'ARMS',      '{"TRICEPS"}',                   '{}',                              'CABLE',       'ISOLATION', 12, 20, false, false),
('a2000000-0000-0000-0000-000000000054', 'Rope Pushdown',                    'ARMS',      '{"TRICEPS"}',                   '{}',                              'CABLE',       'ISOLATION', 10, 20, true,  false),
('a2000000-0000-0000-0000-000000000055', 'Reverse Grip Pushdown',            'ARMS',      '{"TRICEPS"}',                   '{"FOREARMS"}',                    'CABLE',       'ISOLATION', 10, 20, true,  false),
('a2000000-0000-0000-0000-000000000056', 'Bench Dip',                        'ARMS',      '{"TRICEPS"}',                   '{"FRONT_DELTS","LOWER_CHEST"}',   'BODYWEIGHT',  'ISOLATION', 8,  20, true,  false),
('a2000000-0000-0000-0000-000000000057', 'Tricep Dip',                       'ARMS',      '{"TRICEPS"}',                   '{"FRONT_DELTS","LOWER_CHEST"}',   'BODYWEIGHT',  'COMPOUND',  5,  15, true,  false),
('a2000000-0000-0000-0000-000000000058', 'Reverse Curl',                     'ARMS',      '{"FOREARMS","BICEPS"}',         '{}',                              'BARBELL',     'ISOLATION', 10, 15, true,  false),
('a2000000-0000-0000-0000-000000000059', 'Wrist Curl',                       'ARMS',      '{"FOREARMS"}',                  '{}',                              'BARBELL',     'ISOLATION', 15, 25, true,  false),
('a2000000-0000-0000-0000-000000000060', 'Dumbbell Wrist Curl',              'ARMS',      '{"FOREARMS"}',                  '{}',                              'DUMBBELL',    'ISOLATION', 15, 25, true,  false),
('a2000000-0000-0000-0000-000000000061', 'Drag Curl',                        'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',                    'BARBELL',     'ISOLATION', 8,  15, true,  false),
('a2000000-0000-0000-0000-000000000062', 'Spider Curl',                      'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',                    'BARBELL',     'ISOLATION', 8,  15, true,  false),
('a2000000-0000-0000-0000-000000000063', 'Cable Preacher Curl',              'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',                    'CABLE',       'ISOLATION', 10, 15, true,  false),
('a2000000-0000-0000-0000-000000000064', 'Single Arm Tricep Pushdown',       'ARMS',      '{"TRICEPS"}',                   '{}',                              'CABLE',       'ISOLATION', 10, 20, false, false),
('a2000000-0000-0000-0000-000000000065', 'Zottman Curl',                     'ARMS',      '{"BICEPS","FOREARMS"}',         '{}',                              'DUMBBELL',    'ISOLATION', 10, 15, false, false),
('a2000000-0000-0000-0000-000000000066', 'Cross Body Hammer Curl',           'ARMS',      '{"BICEPS","FOREARMS"}',         '{}',                              'DUMBBELL',    'ISOLATION', 10, 15, false, false),
('a2000000-0000-0000-0000-000000000067', 'Bayesian Curl',                    'ARMS',      '{"BICEPS"}',                    '{"FOREARMS"}',                    'CABLE',       'ISOLATION', 10, 15, false, false),

-- ── CORE ──────────────────────────────────────────────────
('a2000000-0000-0000-0000-000000000068', 'Crunch',                           'CORE',      '{"ABS"}',                       '{"OBLIQUES"}',                    'BODYWEIGHT',  'ISOLATION', 15, 30, true,  false),
('a2000000-0000-0000-0000-000000000069', 'Bicycle Crunch',                   'CORE',      '{"ABS","OBLIQUES"}',            '{}',                              'BODYWEIGHT',  'ISOLATION', 12, 25, true,  false),
('a2000000-0000-0000-0000-000000000070', 'Dragon Flag',                      'CORE',      '{"ABS"}',                       '{"OBLIQUES","HIP_FLEXORS"}',      'BODYWEIGHT',  'ISOLATION', 5,  10, true,  false),
('a2000000-0000-0000-0000-000000000071', 'Pallof Press',                     'CORE',      '{"ABS","OBLIQUES"}',            '{"LOWER_BACK"}',                  'CABLE',       'ISOLATION', 10, 15, false, false),
('a2000000-0000-0000-0000-000000000072', 'Cable Woodchop High to Low',       'CORE',      '{"OBLIQUES"}',                  '{"ABS","SHOULDERS"}',             'CABLE',       'ISOLATION', 10, 15, false, false),
('a2000000-0000-0000-0000-000000000073', 'Reverse Crunch',                   'CORE',      '{"ABS","HIP_FLEXORS"}',         '{"OBLIQUES"}',                    'BODYWEIGHT',  'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000074', 'Landmine Twist',                   'CORE',      '{"OBLIQUES"}',                  '{"ABS","SHOULDERS"}',             'BARBELL',     'ISOLATION', 10, 20, true,  false),
('a2000000-0000-0000-0000-000000000075', 'Hollow Body Hold',                 'CORE',      '{"ABS"}',                       '{"HIP_FLEXORS","LOWER_BACK"}',    'BODYWEIGHT',  'ISOLATION', 1,  1,  true,  false),
('a2000000-0000-0000-0000-000000000076', 'V-Up',                             'CORE',      '{"ABS","HIP_FLEXORS"}',         '{"OBLIQUES"}',                    'BODYWEIGHT',  'ISOLATION', 10, 20, true,  false),
('a2000000-0000-0000-0000-000000000077', 'Toes To Bar',                      'CORE',      '{"ABS","HIP_FLEXORS"}',         '{"OBLIQUES"}',                    'BODYWEIGHT',  'ISOLATION', 8,  15, true,  false),
('a2000000-0000-0000-0000-000000000078', 'Weighted Sit Up',                  'CORE',      '{"ABS"}',                       '{"HIP_FLEXORS","OBLIQUES"}',      'OTHER',       'ISOLATION', 10, 20, true,  false),
('a2000000-0000-0000-0000-000000000079', 'Cable Oblique Crunch',             'CORE',      '{"OBLIQUES"}',                  '{"ABS"}',                         'CABLE',       'ISOLATION', 12, 20, false, false),
('a2000000-0000-0000-0000-000000000080', 'Plank Hip Dip',                    'CORE',      '{"OBLIQUES","ABS"}',            '{"LOWER_BACK"}',                  'BODYWEIGHT',  'ISOLATION', 15, 30, true,  false),

-- ── FULL BODY ─────────────────────────────────────────────
('a2000000-0000-0000-0000-000000000081', 'Kettlebell Clean',                 'FULL_BODY', '{"TRAPS","GLUTES","QUADS"}',    '{"HAMSTRINGS","CALVES","FRONT_DELTS"}','KETTLEBELL','COMPOUND', 5,  10, true,  false),
('a2000000-0000-0000-0000-000000000082', 'Kettlebell Snatch',                'FULL_BODY', '{"TRAPS","GLUTES","SHOULDERS"}','{"HAMSTRINGS","ABS"}',            'KETTLEBELL',  'COMPOUND',  3,  8,  false, false),
('a2000000-0000-0000-0000-000000000083', 'Box Jump',                         'FULL_BODY', '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',         'BODYWEIGHT',  'COMPOUND',  5,  10, true,  false),
('a2000000-0000-0000-0000-000000000084', 'Broad Jump',                       'FULL_BODY', '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES"}',         'BODYWEIGHT',  'COMPOUND',  5,  8,  true,  false),
('a2000000-0000-0000-0000-000000000085', 'Wall Ball',                        'FULL_BODY', '{"QUADS","GLUTES","FRONT_DELTS"}','{"TRICEPS","ABS"}',             'OTHER',       'COMPOUND',  10, 20, true,  false),
('a2000000-0000-0000-0000-000000000086', 'Battle Rope Waves',                'FULL_BODY', '{"FRONT_DELTS","TRAPS"}',       '{"ABS","FOREARMS"}',              'OTHER',       'COMPOUND',  1,  1,  true,  false),
('a2000000-0000-0000-0000-000000000087', 'Sled Push',                        'FULL_BODY', '{"QUADS","GLUTES"}',            '{"HAMSTRINGS","CALVES","ABS"}',   'OTHER',       'COMPOUND',  1,  1,  true,  false),
('a2000000-0000-0000-0000-000000000088', 'Tire Flip',                        'FULL_BODY', '{"GLUTES","QUADS","TRAPS"}',    '{"HAMSTRINGS","LOWER_BACK"}',     'OTHER',       'COMPOUND',  5,  10, true,  false),
('a2000000-0000-0000-0000-000000000089', 'Turkish Get Up',                   'FULL_BODY', '{"GLUTES","ABS","SHOULDERS"}',  '{"TRICEPS","LOWER_BACK"}',        'KETTLEBELL',  'COMPOUND',  3,  6,  false, false),
('a2000000-0000-0000-0000-000000000090', 'Barbell Complex',                  'FULL_BODY', '{"QUADS","TRAPS","GLUTES"}',    '{"HAMSTRINGS","FRONT_DELTS","ABS"}','BARBELL',   'COMPOUND',  5,  8,  true,  false),
('a2000000-0000-0000-0000-000000000091', 'Dumbbell Thruster',                'FULL_BODY', '{"QUADS","FRONT_DELTS","GLUTES"}','{"TRICEPS","ABS"}',             'DUMBBELL',    'COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000092', 'Mountain Climber',                 'FULL_BODY', '{"ABS","HIP_FLEXORS"}',         '{"QUADS","FRONT_DELTS"}',         'BODYWEIGHT',  'COMPOUND',  10, 30, true,  false),

-- ── BACK (additional) ─────────────────────────────────────
('a2000000-0000-0000-0000-000000000093', 'Band Pull Apart',                  'BACK',      '{"REAR_DELTS","RHOMBOIDS"}',   '{"TRAPS"}',                       'OTHER',       'ISOLATION', 15, 30, true,  false),
('a2000000-0000-0000-0000-000000000094', 'Inverted Row',                     'BACK',      '{"RHOMBOIDS","LATS"}',         '{"BICEPS","REAR_DELTS"}',         'BODYWEIGHT',  'COMPOUND',  8,  15, true,  false),
('a2000000-0000-0000-0000-000000000095', 'Cable Face Pull with Rotation',    'BACK',      '{"REAR_DELTS","TRAPS"}',       '{"RHOMBOIDS","BICEPS"}',          'CABLE',       'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000096', 'Trap Bar Deadlift',                'BACK',      '{"LOWER_BACK","TRAPS","LATS"}','{"GLUTES","HAMSTRINGS","QUADS"}',  'OTHER',       'COMPOUND',  3,  6,  true,  false),
('a2000000-0000-0000-0000-000000000097', 'Seal Row',                         'BACK',      '{"RHOMBOIDS","LATS"}',         '{"BICEPS","REAR_DELTS"}',         'BARBELL',     'COMPOUND',  8,  15, true,  false),

-- ── LEGS (additional) ─────────────────────────────────────
('a2000000-0000-0000-0000-000000000098', 'Adductor Machine',                 'LEGS',      '{"ADDUCTORS"}',                 '{"GLUTES"}',                      'MACHINE',     'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000099', 'Abductor Machine',                 'LEGS',      '{"GLUTES"}',                    '{"ABDUCTORS"}',                   'MACHINE',     'ISOLATION', 12, 20, true,  false),
('a2000000-0000-0000-0000-000000000100', 'Glute Bridge',                     'LEGS',      '{"GLUTES"}',                    '{"HAMSTRINGS","LOWER_BACK"}',     'BODYWEIGHT',  'COMPOUND',  12, 20, true,  false)

ON CONFLICT (id) DO NOTHING;
