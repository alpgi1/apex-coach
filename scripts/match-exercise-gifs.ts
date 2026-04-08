/**
 * One-time script to match backend exercises with ExerciseDB GIF URLs.
 *
 * Usage:  npx ts-node scripts/match-exercise-gifs.ts
 *
 * Outputs:
 *   scripts/match-results.json   — full audit log for manual review
 *   scripts/update_gif_urls.sql  — UPDATE statements for Supabase
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ═══════════════════ ExerciseDB types ═══════════════════ */

interface ExerciseDbItem {
    exerciseId: string;
    name: string;
    gifUrl: string;
    targetMuscles: string[];
    bodyParts: string[];
    equipments: string[];
    secondaryMuscles: string[];
    instructions: string[];
}

interface ExerciseDbResponse {
    success: boolean;
    metadata: { totalPages: number; currentPage: number };
    data: ExerciseDbItem[];
}

/* ═══════════════════ Backend exercises ═══════════════════ */

interface BackendExercise {
    name: string;
    equipment: string;
}

// All 85 backend exercises from V2 + V6 migrations
const BACKEND_EXERCISES: BackendExercise[] = [
    // V2 — CHEST
    { name: 'Barbell Bench Press', equipment: 'BARBELL' },
    { name: 'Incline Dumbbell Press', equipment: 'DUMBBELL' },
    { name: 'Cable Fly', equipment: 'CABLE' },
    { name: 'Dumbbell Fly', equipment: 'DUMBBELL' },
    { name: 'Push Up', equipment: 'BODYWEIGHT' },
    // V2 — BACK
    { name: 'Barbell Row', equipment: 'BARBELL' },
    { name: 'Pull Up', equipment: 'BODYWEIGHT' },
    { name: 'Lat Pulldown', equipment: 'CABLE' },
    { name: 'Seated Cable Row', equipment: 'CABLE' },
    { name: 'Deadlift', equipment: 'BARBELL' },
    // V2 — LEGS
    { name: 'Barbell Squat', equipment: 'BARBELL' },
    { name: 'Romanian Deadlift', equipment: 'BARBELL' },
    { name: 'Leg Press', equipment: 'MACHINE' },
    { name: 'Leg Curl', equipment: 'MACHINE' },
    { name: 'Leg Extension', equipment: 'MACHINE' },
    { name: 'Calf Raise', equipment: 'MACHINE' },
    { name: 'Bulgarian Split Squat', equipment: 'DUMBBELL' },
    // V2 — SHOULDERS
    { name: 'Overhead Press', equipment: 'BARBELL' },
    { name: 'Dumbbell Lateral Raise', equipment: 'DUMBBELL' },
    { name: 'Face Pull', equipment: 'CABLE' },
    { name: 'Dumbbell Shoulder Press', equipment: 'DUMBBELL' },
    // V2 — ARMS
    { name: 'Barbell Curl', equipment: 'BARBELL' },
    { name: 'Dumbbell Curl', equipment: 'DUMBBELL' },
    { name: 'Tricep Pushdown', equipment: 'CABLE' },
    { name: 'Skull Crusher', equipment: 'BARBELL' },
    { name: 'Hammer Curl', equipment: 'DUMBBELL' },
    // V2 — CORE
    { name: 'Plank', equipment: 'BODYWEIGHT' },
    { name: 'Cable Crunch', equipment: 'CABLE' },
    { name: 'Hanging Leg Raise', equipment: 'BODYWEIGHT' },
    // V2 — FULL BODY
    { name: 'Power Clean', equipment: 'BARBELL' },

    // V6 — CHEST
    { name: 'Decline Barbell Press', equipment: 'BARBELL' },
    { name: 'Machine Chest Press', equipment: 'MACHINE' },
    { name: 'Chest Dip', equipment: 'BODYWEIGHT' },
    { name: 'Pec Deck', equipment: 'MACHINE' },
    { name: 'Cable Crossover', equipment: 'CABLE' },
    { name: 'Incline Barbell Press', equipment: 'BARBELL' },
    { name: 'Dumbbell Bench Press', equipment: 'DUMBBELL' },
    // V6 — BACK
    { name: 'One Arm Dumbbell Row', equipment: 'DUMBBELL' },
    { name: 'T-Bar Row', equipment: 'BARBELL' },
    { name: 'Chest Supported Row', equipment: 'MACHINE' },
    { name: 'Pendlay Row', equipment: 'BARBELL' },
    { name: 'Chin Up', equipment: 'BODYWEIGHT' },
    { name: 'Straight Arm Pulldown', equipment: 'CABLE' },
    { name: 'Hyperextension', equipment: 'BODYWEIGHT' },
    { name: 'Single Arm Cable Row', equipment: 'CABLE' },
    { name: 'Machine Row', equipment: 'MACHINE' },
    // V6 — LEGS
    { name: 'Front Squat', equipment: 'BARBELL' },
    { name: 'Goblet Squat', equipment: 'DUMBBELL' },
    { name: 'Hack Squat', equipment: 'MACHINE' },
    { name: 'Hip Thrust', equipment: 'BARBELL' },
    { name: 'Sumo Deadlift', equipment: 'BARBELL' },
    { name: 'Walking Lunge', equipment: 'DUMBBELL' },
    { name: 'Seated Leg Curl', equipment: 'MACHINE' },
    { name: 'Standing Calf Raise', equipment: 'MACHINE' },
    { name: 'Glute Kickback', equipment: 'CABLE' },
    // V6 — SHOULDERS
    { name: 'Arnold Press', equipment: 'DUMBBELL' },
    { name: 'Machine Shoulder Press', equipment: 'MACHINE' },
    { name: 'Cable Lateral Raise', equipment: 'CABLE' },
    { name: 'Rear Delt Fly', equipment: 'DUMBBELL' },
    { name: 'Cable Rear Delt Fly', equipment: 'CABLE' },
    { name: 'Barbell Shrug', equipment: 'BARBELL' },
    { name: 'Dumbbell Shrug', equipment: 'DUMBBELL' },
    { name: 'Upright Row', equipment: 'BARBELL' },
    // V6 — ARMS
    { name: 'Cable Curl', equipment: 'CABLE' },
    { name: 'Preacher Curl', equipment: 'BARBELL' },
    { name: 'Incline Dumbbell Curl', equipment: 'DUMBBELL' },
    { name: 'Concentration Curl', equipment: 'DUMBBELL' },
    { name: 'Overhead Cable Tricep Extension', equipment: 'CABLE' },
    { name: 'Dumbbell Overhead Tricep Extension', equipment: 'DUMBBELL' },
    { name: 'Tricep Kickback', equipment: 'DUMBBELL' },
    { name: 'Close-Grip Bench Press', equipment: 'BARBELL' },
    { name: 'EZ Bar Curl', equipment: 'BARBELL' },
    { name: 'Dumbbell Tricep Kickback', equipment: 'DUMBBELL' },
    // V6 — CORE
    { name: 'Russian Twist', equipment: 'BODYWEIGHT' },
    { name: 'Side Plank', equipment: 'BODYWEIGHT' },
    { name: 'Dead Bug', equipment: 'BODYWEIGHT' },
    { name: 'Decline Sit Up', equipment: 'BODYWEIGHT' },
    { name: 'Wood Chop', equipment: 'CABLE' },
    { name: 'Ab Wheel Rollout', equipment: 'BODYWEIGHT' },
    { name: 'Leg Raise', equipment: 'BODYWEIGHT' },
    // V6 — FULL BODY
    { name: 'Kettlebell Swing', equipment: 'KETTLEBELL' },
    { name: "Farmer's Walk", equipment: 'DUMBBELL' },
    { name: 'Thruster', equipment: 'BARBELL' },
    { name: 'Barbell Clean and Press', equipment: 'BARBELL' },
    { name: 'Burpee', equipment: 'BODYWEIGHT' },
];

/* ═══════════════════ V9 exercises (100 new) ═══════════════════ */

const V9_EXERCISES: BackendExercise[] = [
    // CHEST
    { name: 'Smith Machine Bench Press',        equipment: 'SMITH_MACHINE' },
    { name: 'Low Cable Fly',                    equipment: 'CABLE' },
    { name: 'High Cable Fly',                   equipment: 'CABLE' },
    { name: 'Incline Machine Press',            equipment: 'MACHINE' },
    { name: 'Decline Dumbbell Press',           equipment: 'DUMBBELL' },
    { name: 'Incline Dumbbell Fly',             equipment: 'DUMBBELL' },
    { name: 'Smith Machine Incline Press',      equipment: 'SMITH_MACHINE' },
    { name: 'Landmine Press',                   equipment: 'BARBELL' },
    // BACK
    { name: 'Wide Grip Lat Pulldown',           equipment: 'CABLE' },
    { name: 'Close Grip Lat Pulldown',          equipment: 'CABLE' },
    { name: 'Reverse Grip Barbell Row',         equipment: 'BARBELL' },
    { name: 'Meadows Row',                      equipment: 'BARBELL' },
    { name: 'Cable Pullover',                   equipment: 'CABLE' },
    { name: 'Dumbbell Pullover',                equipment: 'DUMBBELL' },
    { name: 'Smith Machine Row',                equipment: 'SMITH_MACHINE' },
    { name: 'Neutral Grip Pull Up',             equipment: 'BODYWEIGHT' },
    { name: 'Assisted Pull Up',                 equipment: 'MACHINE' },
    { name: 'Rack Pull',                        equipment: 'BARBELL' },
    { name: 'Good Morning',                     equipment: 'BARBELL' },
    { name: 'Ring Row',                         equipment: 'BODYWEIGHT' },
    // LEGS
    { name: 'Smith Machine Squat',              equipment: 'SMITH_MACHINE' },
    { name: 'Barbell Lunge',                    equipment: 'BARBELL' },
    { name: 'Dumbbell Romanian Deadlift',       equipment: 'DUMBBELL' },
    { name: 'Step Up',                          equipment: 'DUMBBELL' },
    { name: 'Box Squat',                        equipment: 'BARBELL' },
    { name: 'Nordic Hamstring Curl',            equipment: 'BODYWEIGHT' },
    { name: 'Donkey Calf Raise',                equipment: 'MACHINE' },
    { name: 'Seated Calf Raise',                equipment: 'MACHINE' },
    { name: 'Cable Romanian Deadlift',          equipment: 'CABLE' },
    { name: 'Single Leg Press',                 equipment: 'MACHINE' },
    { name: 'Barbell Hip Thrust',               equipment: 'BARBELL' },
    { name: 'Dumbbell Hip Thrust',              equipment: 'DUMBBELL' },
    { name: 'Cable Pull Through',               equipment: 'CABLE' },
    { name: 'Reverse Lunge',                    equipment: 'DUMBBELL' },
    { name: 'Side Lunge',                       equipment: 'DUMBBELL' },
    { name: 'Leg Press Calf Raise',             equipment: 'MACHINE' },
    { name: 'Sissy Squat',                      equipment: 'BODYWEIGHT' },
    { name: 'Jefferson Squat',                  equipment: 'BARBELL' },
    // SHOULDERS
    { name: 'Dumbbell Lateral Raise',           equipment: 'DUMBBELL' },
    { name: 'Seated Dumbbell Lateral Raise',    equipment: 'DUMBBELL' },
    { name: 'Smith Machine Overhead Press',     equipment: 'SMITH_MACHINE' },
    { name: 'Push Press',                       equipment: 'BARBELL' },
    { name: 'Plate Front Raise',                equipment: 'OTHER' },
    { name: 'Dumbbell Front Raise',             equipment: 'DUMBBELL' },
    { name: 'Cable Front Raise',                equipment: 'CABLE' },
    { name: 'Prone Rear Delt Raise',            equipment: 'DUMBBELL' },
    { name: 'Dumbbell Upright Row',             equipment: 'DUMBBELL' },
    { name: 'Cable Upright Row',                equipment: 'CABLE' },
    { name: 'Landmine Lateral Raise',           equipment: 'BARBELL' },
    { name: 'Kettlebell Overhead Press',        equipment: 'KETTLEBELL' },
    // ARMS
    { name: 'EZ Bar Skull Crusher',             equipment: 'BARBELL' },
    { name: 'Dumbbell Skull Crusher',           equipment: 'DUMBBELL' },
    { name: 'Cable Tricep Kickback',            equipment: 'CABLE' },
    { name: 'Rope Pushdown',                    equipment: 'CABLE' },
    { name: 'Reverse Grip Pushdown',            equipment: 'CABLE' },
    { name: 'Bench Dip',                        equipment: 'BODYWEIGHT' },
    { name: 'Tricep Dip',                       equipment: 'BODYWEIGHT' },
    { name: 'Reverse Curl',                     equipment: 'BARBELL' },
    { name: 'Wrist Curl',                       equipment: 'BARBELL' },
    { name: 'Dumbbell Wrist Curl',              equipment: 'DUMBBELL' },
    { name: 'Drag Curl',                        equipment: 'BARBELL' },
    { name: 'Spider Curl',                      equipment: 'BARBELL' },
    { name: 'Cable Preacher Curl',              equipment: 'CABLE' },
    { name: 'Single Arm Tricep Pushdown',       equipment: 'CABLE' },
    { name: 'Zottman Curl',                     equipment: 'DUMBBELL' },
    { name: 'Cross Body Hammer Curl',           equipment: 'DUMBBELL' },
    { name: 'Bayesian Curl',                    equipment: 'CABLE' },
    // CORE
    { name: 'Crunch',                           equipment: 'BODYWEIGHT' },
    { name: 'Bicycle Crunch',                   equipment: 'BODYWEIGHT' },
    { name: 'Dragon Flag',                      equipment: 'BODYWEIGHT' },
    { name: 'Pallof Press',                     equipment: 'CABLE' },
    { name: 'Cable Woodchop High to Low',       equipment: 'CABLE' },
    { name: 'Reverse Crunch',                   equipment: 'BODYWEIGHT' },
    { name: 'Landmine Twist',                   equipment: 'BARBELL' },
    { name: 'Hollow Body Hold',                 equipment: 'BODYWEIGHT' },
    { name: 'V-Up',                             equipment: 'BODYWEIGHT' },
    { name: 'Toes To Bar',                      equipment: 'BODYWEIGHT' },
    { name: 'Weighted Sit Up',                  equipment: 'OTHER' },
    { name: 'Cable Oblique Crunch',             equipment: 'CABLE' },
    { name: 'Plank Hip Dip',                    equipment: 'BODYWEIGHT' },
    // FULL BODY
    { name: 'Kettlebell Clean',                 equipment: 'KETTLEBELL' },
    { name: 'Kettlebell Snatch',                equipment: 'KETTLEBELL' },
    { name: 'Box Jump',                         equipment: 'BODYWEIGHT' },
    { name: 'Broad Jump',                       equipment: 'BODYWEIGHT' },
    { name: 'Wall Ball',                        equipment: 'OTHER' },
    { name: 'Battle Rope Waves',                equipment: 'OTHER' },
    { name: 'Sled Push',                        equipment: 'OTHER' },
    { name: 'Tire Flip',                        equipment: 'OTHER' },
    { name: 'Turkish Get Up',                   equipment: 'KETTLEBELL' },
    { name: 'Barbell Complex',                  equipment: 'BARBELL' },
    { name: 'Dumbbell Thruster',                equipment: 'DUMBBELL' },
    { name: 'Mountain Climber',                 equipment: 'BODYWEIGHT' },
    // BACK (additional)
    { name: 'Band Pull Apart',                  equipment: 'OTHER' },
    { name: 'Inverted Row',                     equipment: 'BODYWEIGHT' },
    { name: 'Cable Face Pull with Rotation',    equipment: 'CABLE' },
    { name: 'Trap Bar Deadlift',                equipment: 'OTHER' },
    { name: 'Seal Row',                         equipment: 'BARBELL' },
    // LEGS (additional)
    { name: 'Adductor Machine',                 equipment: 'MACHINE' },
    { name: 'Abductor Machine',                 equipment: 'MACHINE' },
    { name: 'Glute Bridge',                     equipment: 'BODYWEIGHT' },
];

/* ═══════════════════ Manual overrides ═══════════════════ */

// Backend name (lowercase) → ExerciseDB name (lowercase) for hard-to-match exercises
const MANUAL_OVERRIDES: Record<string, string> = {
    'overhead press': 'barbell standing military press',
    'skull crusher': 'barbell lying triceps extension skull crusher',
    'pec deck': 'cable upper chest crossovers',
    'cable fly': 'cable middle fly',
    'push up': 'push-up',
    'pull up': 'pull-up',
    'chin up': 'chin-up',
    'chest dip': 'chest dip',
    'barbell row': 'barbell bent over row',
    'barbell squat': 'barbell full squat',
    'deadlift': 'barbell deadlift',
    'calf raise': 'sled calf press on leg press',
    'tricep pushdown': 'cable pushdown',
    'face pull': 'cable rear delt row (with rope)',
    'dumbbell fly': 'dumbbell fly',
    'lat pulldown': 'cable bar lateral pulldown',
    'leg curl': 'lever lying leg curl',
    'leg extension': 'lever leg extension',
    'leg press': 'sled leg press',
    'close-grip bench press': 'barbell close-grip bench press',
    'ez bar curl': 'ez barbell curl',
    'cable crunch': 'cable crunch',
    'hanging leg raise': 'hanging leg raise',
    'hip thrust': 'barbell glute bridge',
    'hack squat': 'sled hack squat',
    'front squat': 'barbell front squat',
    'romanian deadlift': 'barbell romanian deadlift',
    'sumo deadlift': 'barbell sumo deadlift',
    'incline barbell press': 'barbell incline bench press',
    'decline barbell press': 'barbell decline bench press',
    'incline dumbbell press': 'dumbbell incline bench press',
    'dumbbell shoulder press': 'dumbbell shoulder press',
    'dumbbell lateral raise': 'dumbbell lateral raise',
    'machine chest press': 'lever chest press',
    'machine shoulder press': 'lever shoulder press',
    'machine row': 'lever seated row',
    'seated cable row': 'cable seated row',
    'straight arm pulldown': 'cable straight arm pulldown',
    'pendlay row': 'barbell pendlay row',
    'power clean': 'barbell power clean',
    'standing calf raise': 'smith machine calf raise',
    'cable crossover': 'cable standing up straight crossovers',
    'preacher curl': 'barbell preacher curl',
    'cable lateral raise': 'cable one arm lateral raise',
    'upright row': 'barbell upright row',
    'barbell shrug': 'barbell shrug',
    'dumbbell shrug': 'dumbbell shrug',
    'russian twist': 'weighted russian twist',
    'wood chop': 'cable twist',
    'goblet squat': 'dumbbell goblet squat',
    'walking lunge': 'dumbbell walking lunge',
    'kettlebell swing': 'kettlebell swing',
    'concentration curl': 'dumbbell concentration curl',
    'arnold press': 'dumbbell arnold press',
    'decline sit up': 'decline sit-up',
    'hyperextension': 'hyperextension',
    'rear delt fly': 'dumbbell rear delt raise',
    'cable rear delt fly': 'cable rear delt row (with rope)',
    'dumbbell overhead tricep extension': 'dumbbell seated reverse grip one arm overhead tricep extension',
    'overhead cable tricep extension': 'cable high pulley overhead tricep extension',
    'tricep kickback': 'dumbbell kickback',
    'dumbbell tricep kickback': 'dumbbell kickback',
    'seated leg curl': 'lever seated leg curl',
    'chest supported row': 'lever t bar row',
    'single arm cable row': 'cable rope crossover seated row',
    'incline dumbbell curl': 'dumbbell incline curl',
    'glute kickback': 'cable kickback',
    'one arm dumbbell row': 'dumbbell bent over row',
    't-bar row': 'lever t-bar reverse grip row',
    'bulgarian split squat': 'dumbbell single leg split squat',
    "farmer's walk": 'farmers walk',
    'plank': 'weighted front plank',
    'dumbbell curl': 'dumbbell biceps curl',
    'side plank': 'bodyweight incline side plank',
    'leg raise': 'hanging straight leg raise',

    // ── V9 overrides ────────────────────────────────────────
    // CHEST
    'low cable fly':                    'cable low fly',
    'high cable fly':                   'cable upper chest crossovers',
    'incline machine press':            'lever incline chest press',
    'decline dumbbell press':           'dumbbell decline bench press',
    'incline dumbbell fly':             'dumbbell incline fly',
    // BACK
    'wide grip lat pulldown':           'cable lat pulldown full range of motion',
    'close grip lat pulldown':          'cable pulldown (pro lat bar)',
    'reverse grip barbell row':         'barbell reverse grip bent over row',
    'cable pullover':                   'cable straight arm pulldown',
    'dumbbell pullover':                'dumbbell pullover',
    'neutral grip pull up':             'pull up (neutral grip)',
    'assisted pull up':                 'assisted pull-up',
    'rack pull':                        'barbell rack pull',
    'good morning':                     'barbell good morning',
    'ring row':                         'inverted row',
    // LEGS
    'barbell lunge':                    'barbell lunge',
    'dumbbell romanian deadlift':       'dumbbell romanian deadlift',
    'donkey calf raise':                'lever donkey calf raise',
    'seated calf raise':                'lever seated calf raise',
    'cable romanian deadlift':          'dumbbell romanian deadlift',
    'barbell hip thrust':               'barbell glute bridge',
    'dumbbell hip thrust':              'barbell glute bridge',
    'cable pull through':               'cable pull through (with rope)',
    'side lunge':                       'barbell lateral lunge',
    'leg press calf raise':             'sled calf press on leg press',
    'sissy squat':                      'sissy squat',
    'jefferson squat':                  'barbell jefferson squat',
    // SHOULDERS
    'seated dumbbell lateral raise':    'dumbbell seated lateral raise',
    'smith machine overhead press':     'smith standing military press',
    'push press':                       'dumbbell push press',
    'dumbbell front raise':             'dumbbell front raise',
    'cable front raise':                'cable front raise',
    'prone rear delt raise':            'dumbbell rear delt raise',
    'dumbbell upright row':             'dumbbell upright row',
    'cable upright row':                'cable upright row',
    'landmine lateral raise':           'landmine lateral raise',
    // ARMS
    'ez bar skull crusher':             'barbell lying triceps extension skull crusher',
    'dumbbell skull crusher':           'dumbbell lying triceps extension',
    'cable tricep kickback':            'cable kickback',
    'rope pushdown':                    'cable pushdown (with rope attachment)',
    'reverse grip pushdown':            'cable reverse-grip pushdown',
    'bench dip':                        'weighted bench dip',
    'tricep dip':                       'weighted tricep dips',
    'wrist curl':                       'barbell wrist curl',
    'drag curl':                        'barbell drag curl',
    'spider curl':                      'ez barbell spider curl',
    'cable preacher curl':              'cable one arm preacher curl',
    'single arm tricep pushdown':       'cable one arm tricep pushdown',
    'zottman curl':                     'dumbbell zottman curl',
    'cross body hammer curl':           'dumbbell cross body hammer curl',
    // CORE
    'crunch':                           'weighted crunch',
    'bicycle crunch':                   'band bicycle crunch',
    'pallof press':                     'band horizontal pallof press',
    'cable woodchop high to low':       'cable twist',
    'reverse crunch':                   'reverse crunch',
    'landmine twist':                   'landmine 180',
    // FULL BODY
    'tire flip':                        'tire flip',
    'turkish get up':                   'kettlebell turkish get up (squat style)',
    'mountain climber':                 'mountain climber',
    // BACK (additional)
    'inverted row':                     'inverted row',
    'cable face pull with rotation':    'cable rear delt row (with rope)',
    'trap bar deadlift':                'trap bar deadlift',
    // LEGS (additional)
    'adductor machine':                 'lever seated hip adduction',
    'abductor machine':                 'lever seated hip abduction',
    'glute bridge':                     'barbell glute bridge',
};

/* ═══════════════════ Force-null list ═══════════════════ */
// These exercises have no correct ExerciseDB equivalent — auto-matching produces wrong results.
const FORCE_NULL_EXERCISES = new Set([
    'dragon flag',         // jaccard matches unrelated "flag" exercise
    'single leg press',    // jaccard matches "smith leg press" (wrong equipment + movement)
    'dumbbell wrist curl', // jaccard matches "dumbbell reverse wrist curl" (opposite movement)
]);

/* ═══════════════════ Helpers ═══════════════════ */

function normalize(s: string): string {
    return s.toLowerCase().replace(/[-'']/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(s: string): Set<string> {
    return new Set(normalize(s).split(' ').filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
    let intersection = 0;
    for (const t of a) if (b.has(t)) intersection++;
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

function equipmentMatch(backendEquip: string, dbEquipments: string[]): boolean {
    const map: Record<string, string[]> = {
        BARBELL: ['barbell', 'ez barbell', 'olympic barbell', 'trap bar'],
        DUMBBELL: ['dumbbell'],
        CABLE: ['cable'],
        MACHINE: ['leverage machine', 'sled', 'lever', 'smith machine', 'machine'],
        BODYWEIGHT: ['body weight'],
        KETTLEBELL: ['kettlebell'],
        SMITH_MACHINE: ['smith machine'],
    };
    const aliases = map[backendEquip] ?? [];
    const dbLower = dbEquipments.map(e => e.toLowerCase());
    return aliases.some(a => dbLower.some(d => d.includes(a) || a.includes(d)));
}

async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

/* ═══════════════════ Fetch all ExerciseDB exercises ═══════════════════ */

const BASE = 'https://exercisedb.dev/api/v1';

async function fetchAllExerciseDb(): Promise<ExerciseDbItem[]> {
    // Try to load cached data first
    const cachePath = path.join(__dirname, 'exercisedb-cache.json');
    if (fs.existsSync(cachePath)) {
        console.log('Loading from cache...');
        const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as ExerciseDbItem[];
        console.log(`Loaded ${cached.length} exercises from cache\n`);
        return cached;
    }

    const all: ExerciseDbItem[] = [];
    let offset = 0;
    const limit = 100;

    console.log('Fetching ExerciseDB exercises...');

    while (true) {
        const url = `${BASE}/exercises?offset=${offset}&limit=${limit}`;

        let res: Response | null = null;
        for (let attempt = 0; attempt < 8; attempt++) {
            res = await fetch(url);
            if (res.status === 429) {
                const wait = Math.min((attempt + 1) * 5000, 60000);
                console.log(`  Rate limited, waiting ${wait / 1000}s...`);
                await sleep(wait);
                continue;
            }
            break;
        }

        if (!res || !res.ok) throw new Error(`ExerciseDB ${res?.status}: ${res?.statusText}`);
        const json: ExerciseDbResponse = await res.json();

        all.push(...json.data);
        console.log(`  Fetched ${all.length} exercises (page ${json.metadata.currentPage}/${json.metadata.totalPages})`);

        if (json.metadata.currentPage >= json.metadata.totalPages) break;
        offset += limit;
        await sleep(3000); // rate limit courtesy — API limits ~10 req/window
    }

    // Cache for future runs
    fs.writeFileSync(cachePath, JSON.stringify(all, null, 2));
    console.log(`Cached to ${cachePath}`);

    console.log(`Total ExerciseDB exercises: ${all.length}\n`);
    return all;
}

/* ═══════════════════ Matching logic ═══════════════════ */

interface MatchResult {
    backendName: string;
    backendEquipment: string;
    matchedExerciseDbName: string | null;
    gifUrl: string | null;
    method: 'manual' | 'exact' | 'jaccard' | 'substring' | 'none';
    score: number;
}

function findMatch(
    backend: BackendExercise,
    dbExercises: ExerciseDbItem[],
): MatchResult {
    const bNorm = normalize(backend.name);
    const bTokens = tokenize(backend.name);

    // Pass 0: Manual override (normalize keys for lookup since normalize() strips punctuation)
    const override = Object.entries(MANUAL_OVERRIDES).find(([k]) => normalize(k) === bNorm)?.[1];
    if (override) {
        const match = dbExercises.find(e => normalize(e.name) === normalize(override));
        if (match) {
            return {
                backendName: backend.name,
                backendEquipment: backend.equipment,
                matchedExerciseDbName: match.name,
                gifUrl: match.gifUrl,
                method: 'manual',
                score: 1.0,
            };
        }
    }

    // Pass 1: Exact normalized match
    const exactMatch = dbExercises.find(e => normalize(e.name) === bNorm);
    if (exactMatch) {
        return {
            backendName: backend.name,
            backendEquipment: backend.equipment,
            matchedExerciseDbName: exactMatch.name,
            gifUrl: exactMatch.gifUrl,
            method: 'exact',
            score: 1.0,
        };
    }

    // Pass 2: Jaccard with equipment filter
    let bestJaccard: ExerciseDbItem | null = null;
    let bestJaccardScore = 0;

    for (const db of dbExercises) {
        const dbTokens = tokenize(db.name);
        const score = jaccard(bTokens, dbTokens);
        if (score >= 0.5 && score > bestJaccardScore && equipmentMatch(backend.equipment, db.equipments)) {
            bestJaccardScore = score;
            bestJaccard = db;
        }
    }

    if (bestJaccard && bestJaccardScore >= 0.5) {
        return {
            backendName: backend.name,
            backendEquipment: backend.equipment,
            matchedExerciseDbName: bestJaccard.name,
            gifUrl: bestJaccard.gifUrl,
            method: 'jaccard',
            score: bestJaccardScore,
        };
    }

    // Pass 3: Substring containment
    const substringMatch = dbExercises.find(e => {
        const eNorm = normalize(e.name);
        return (eNorm.includes(bNorm) || bNorm.includes(eNorm)) &&
               equipmentMatch(backend.equipment, e.equipments);
    });

    if (substringMatch) {
        return {
            backendName: backend.name,
            backendEquipment: backend.equipment,
            matchedExerciseDbName: substringMatch.name,
            gifUrl: substringMatch.gifUrl,
            method: 'substring',
            score: 0.5,
        };
    }

    // No match
    return {
        backendName: backend.name,
        backendEquipment: backend.equipment,
        matchedExerciseDbName: null,
        gifUrl: null,
        method: 'none',
        score: 0,
    };
}

/* ═══════════════════ Main ═══════════════════ */

function runMatching(exercises: BackendExercise[], dbExercises: ExerciseDbItem[], label: string): MatchResult[] {
    const results: MatchResult[] = [];
    console.log(`\nMatching ${label}...\n`);
    for (const backend of exercises) {
        const forceNull = FORCE_NULL_EXERCISES.has(normalize(backend.name));
        const result = forceNull
            ? { backendName: backend.name, backendEquipment: backend.equipment, matchedExerciseDbName: null, gifUrl: null, method: 'none' as const, score: 0 }
            : findMatch(backend, dbExercises);
        results.push(result);
        const icon = result.method === 'none' ? 'X' : 'V';
        console.log(`  [${icon}] ${backend.name} => ${result.matchedExerciseDbName ?? 'NO MATCH'} (${result.method}, ${result.score.toFixed(2)})`);
    }
    const matched = results.filter(r => r.method !== 'none');
    const unmatched = results.filter(r => r.method === 'none');
    console.log(`\n=== ${label} Summary ===`);
    console.log(`Matched: ${matched.length}/${results.length}`);
    if (unmatched.length > 0) {
        console.log(`Unmatched:`);
        unmatched.forEach(r => console.log(`  - ${r.backendName}`));
    }
    return results;
}

function writeSql(results: MatchResult[], filePath: string, label: string) {
    const matched = results.filter(r => r.method !== 'none');
    const sqlLines = matched.map(r => {
        const escapedName = r.backendName.replace(/'/g, "''");
        const escapedUrl = r.gifUrl!.replace(/'/g, "''");
        return `UPDATE exercises SET gif_url = '${escapedUrl}' WHERE name = '${escapedName}';`;
    });
    const sqlContent = `-- Auto-generated by match-exercise-gifs.ts (${label})\n-- ${matched.length} exercises matched\n-- Review match-results.json before applying!\n\nBEGIN;\n\n${sqlLines.join('\n')}\n\nCOMMIT;\n`;
    fs.writeFileSync(filePath, sqlContent);
    console.log(`Wrote ${filePath}`);
}

async function main() {
    const dbExercises = await fetchAllExerciseDb();

    // V2 + V6 (original 85 exercises)
    const v1Results = runMatching(BACKEND_EXERCISES, dbExercises, 'V2+V6 exercises');
    const v1JsonPath = path.join(__dirname, 'match-results.json');
    fs.writeFileSync(v1JsonPath, JSON.stringify(v1Results, null, 2));
    console.log(`\nWrote ${v1JsonPath}`);
    writeSql(v1Results, path.join(__dirname, 'update_gif_urls.sql'), 'V2+V6');

    // V9 (100 new exercises)
    const v9Results = runMatching(V9_EXERCISES, dbExercises, 'V9 exercises');
    const v9JsonPath = path.join(__dirname, 'match-results-v9.json');
    fs.writeFileSync(v9JsonPath, JSON.stringify(v9Results, null, 2));
    console.log(`\nWrote ${v9JsonPath}`);
    writeSql(v9Results, path.join(__dirname, 'update_gif_urls_v9.sql'), 'V9');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
