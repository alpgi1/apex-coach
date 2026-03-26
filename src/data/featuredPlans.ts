export interface FeaturedExercise {
    exerciseId: string;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
}

export interface FeaturedSession {
    name: string;
    exercises: FeaturedExercise[];
}

export interface FeaturedPlan {
    id: string;
    name: string;
    abbreviation: string;
    color: string;
    tag: string;
    daysPerWeek: number;
    description: string;
    sessions: FeaturedSession[];
}

export const FEATURED_PLANS: FeaturedPlan[] = [
    {
        id: 'featured-ppl',
        name: 'Push Pull Legs',
        abbreviation: 'PPL',
        color: '#FF6000',
        tag: 'Intermediate',
        daysPerWeek: 3,
        description: 'Classic 3-day split separating pushing, pulling and leg movements for maximum muscle recovery.',
        sessions: [
            {
                name: 'PPL – Push',
                exercises: [
                    { exerciseId: 'b8d9f1c4-2a1d-4e5c-9c3f-8a6b2d1f0e4a', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },   // Barbell Bench Press
                    { exerciseId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Incline Barbell Press
                    { exerciseId: 'c3d4e5f6-a7b8-4c9d-ae1f-2a3b4c5d6e7f', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 }, // Cable Fly
                    { exerciseId: 'b4c5d6e7-f8a9-4b0c-8d2e-3f4a5b6c7d8e', targetSets: 4, targetRepsMin: 5, targetRepsMax: 7 },   // Overhead Press
                    { exerciseId: 'c1d2e3f4-a5b6-4c7d-9d8f-9a0b1c2d3e4f', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 }, // Cable Lateral Raise
                    { exerciseId: 'b0c1d2e3-f4a5-4b6c-8d8e-9f0a1b2c3d4e', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Tricep Pushdown
                    { exerciseId: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Skull Crusher
                ],
            },
            {
                name: 'PPL – Pull',
                exercises: [
                    { exerciseId: 'd4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f8a', targetSets: 4, targetRepsMin: 5, targetRepsMax: 8 },   // Barbell Row
                    { exerciseId: 'f6a7b8c9-d0e1-4f2a-bb4c-5d6e7f8a9b0c', targetSets: 4, targetRepsMin: 8, targetRepsMax: 12 },  // Lat Pulldown
                    { exerciseId: 'a7b8c9d0-e1f2-4a3b-8c5d-6e7f8a9b0c1d', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Seated Cable Row
                    { exerciseId: 'e7f8a9b0-c1d2-4e3f-8a5b-6c7d8e9f0a1b', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 }, // Face Pull
                    { exerciseId: 'f8a9b0c1-d2e3-4f4a-9b6c-7d8e9f0a1b2c', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Barbell Curl
                    { exerciseId: 'd2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Hammer Curl
                ],
            },
            {
                name: 'PPL – Legs',
                exercises: [
                    { exerciseId: 'd9e0f2d5-3b2e-5f6d-0d4g-9b7c3e2g1f5b', targetSets: 4, targetRepsMin: 5, targetRepsMax: 7 },   // Barbell Squat
                    { exerciseId: 'b8c9d0e1-f2a3-4b4c-9d6e-7f8a9b0c1d2e', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Romanian Deadlift
                    { exerciseId: 'c9d0e1f2-a3b4-4c5d-8e7f-8a9b0c1d2e3f', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Leg Press
                    { exerciseId: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Leg Curl
                    { exerciseId: 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 }, // Leg Extension
                    { exerciseId: 'a3b4c5d6-e7f8-4a9b-ac1d-2e3f4a5b6c7d', targetSets: 4, targetRepsMin: 15, targetRepsMax: 20 }, // Calf Raise
                ],
            },
        ],
    },
    {
        id: 'featured-upper-lower',
        name: 'Upper / Lower',
        abbreviation: 'U/L',
        color: '#4A9EFF',
        tag: 'Intermediate',
        daysPerWeek: 4,
        description: 'Efficient 4-day split alternating upper and lower body for high frequency training.',
        sessions: [
            {
                name: 'Upper A – Horizontal',
                exercises: [
                    { exerciseId: 'b8d9f1c4-2a1d-4e5c-9c3f-8a6b2d1f0e4a', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },   // Barbell Bench Press
                    { exerciseId: 'd4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f8a', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },   // Barbell Row
                    { exerciseId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Incline Barbell Press
                    { exerciseId: 'a7b8c9d0-e1f2-4a3b-8c5d-6e7f8a9b0c1d', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Seated Cable Row
                    { exerciseId: 'e7f8a9b0-c1d2-4e3f-8a5b-6c7d8e9f0a1b', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 }, // Face Pull
                    { exerciseId: 'b0c1d2e3-f4a5-4b6c-8d8e-9f0a1b2c3d4e', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Tricep Pushdown
                    { exerciseId: 'f8a9b0c1-d2e3-4f4a-9b6c-7d8e9f0a1b2c', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Barbell Curl
                ],
            },
            {
                name: 'Lower A – Quad Focus',
                exercises: [
                    { exerciseId: 'd9e0f2d5-3b2e-5f6d-0d4g-9b7c3e2g1f5b', targetSets: 4, targetRepsMin: 5, targetRepsMax: 7 },   // Barbell Squat
                    { exerciseId: 'b8c9d0e1-f2a3-4b4c-9d6e-7f8a9b0c1d2e', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Romanian Deadlift
                    { exerciseId: 'c9d0e1f2-a3b4-4c5d-8e7f-8a9b0c1d2e3f', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Leg Press
                    { exerciseId: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Leg Curl
                    { exerciseId: 'c5d6e7f8-a9b0-4c1d-bf2f-3a4b5c6d7e8f', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Walking Lunge
                    { exerciseId: 'a3b4c5d6-e7f8-4a9b-ac1d-2e3f4a5b6c7d', targetSets: 3, targetRepsMin: 15, targetRepsMax: 20 }, // Calf Raise
                ],
            },
            {
                name: 'Upper B – Vertical',
                exercises: [
                    { exerciseId: 'b4c5d6e7-f8a9-4b0c-8d2e-3f4a5b6c7d8e', targetSets: 4, targetRepsMin: 5, targetRepsMax: 7 },   // Overhead Press
                    { exerciseId: 'e5f6a7b8-c9d0-4e1f-aa3b-4c5d6e7f8a9b', targetSets: 4, targetRepsMin: 5, targetRepsMax: 8 },   // Pull Up
                    { exerciseId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Dumbbell Bench Press
                    { exerciseId: 'f6a7b8c9-d0e1-4f2a-bb4c-5d6e7f8a9b0c', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Lat Pulldown
                    { exerciseId: 'c3d4e5f6-a7b8-4c9d-ae1f-2a3b4c5d6e7f', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 }, // Cable Fly
                    { exerciseId: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Skull Crusher
                    { exerciseId: 'd2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Hammer Curl
                ],
            },
            {
                name: 'Lower B – Hip Focus',
                exercises: [
                    { exerciseId: 'b8c9d0e1-f2a3-4b4c-9d6e-7f8a9b0c1d2e', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },   // Romanian Deadlift
                    { exerciseId: 'a3b4c5d6-e7f8-4a9b-9d0d-1e2f3a4b5c6d', targetSets: 4, targetRepsMin: 10, targetRepsMax: 12 }, // Hip Thrust
                    { exerciseId: 'd0e1f2a3-b4c5-4d6e-bf8a-9b0c1d2e3f4a', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Bulgarian Split Squat
                    { exerciseId: 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 }, // Leg Extension
                    { exerciseId: 'd6e7f8a9-b0c1-4d2e-8c3a-4b5c6d7e8f9a', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Seated Leg Curl
                    { exerciseId: 'e7f8a9b0-c1d2-4e3f-9d4b-5c6d7e8f9a0b', targetSets: 4, targetRepsMin: 15, targetRepsMax: 20 }, // Standing Calf Raise
                ],
            },
        ],
    },
    {
        id: 'featured-full-body',
        name: 'Full Body',
        abbreviation: 'FB',
        color: '#FF453A',
        tag: 'All Levels',
        daysPerWeek: 3,
        description: 'Train every muscle group each session for maximum weekly frequency and balanced development.',
        sessions: [
            {
                name: 'Full Body – Day 1',
                exercises: [
                    { exerciseId: 'd9e0f2d5-3b2e-5f6d-0d4g-9b7c3e2g1f5b', targetSets: 3, targetRepsMin: 5, targetRepsMax: 7 },   // Barbell Squat
                    { exerciseId: 'b8d9f1c4-2a1d-4e5c-9c3f-8a6b2d1f0e4a', targetSets: 3, targetRepsMin: 6, targetRepsMax: 8 },   // Barbell Bench Press
                    { exerciseId: 'd4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f8a', targetSets: 3, targetRepsMin: 6, targetRepsMax: 8 },   // Barbell Row
                    { exerciseId: 'b4c5d6e7-f8a9-4b0c-8d2e-3f4a5b6c7d8e', targetSets: 3, targetRepsMin: 6, targetRepsMax: 8 },   // Overhead Press
                    { exerciseId: 'b8c9d0e1-f2a3-4b4c-9d6e-7f8a9b0c1d2e', targetSets: 2, targetRepsMin: 10, targetRepsMax: 12 }, // Romanian Deadlift
                    { exerciseId: 'b0c1d2e3-f4a5-4b6c-8d8e-9f0a1b2c3d4e', targetSets: 2, targetRepsMin: 12, targetRepsMax: 15 }, // Tricep Pushdown
                ],
            },
            {
                name: 'Full Body – Day 2',
                exercises: [
                    { exerciseId: 'b8c9d0e1-f2a3-4b4c-9d6e-7f8a9b0c1d2e', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },   // Romanian Deadlift
                    { exerciseId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Incline Barbell Press
                    { exerciseId: 'e5f6a7b8-c9d0-4e1f-aa3b-4c5d6e7f8a9b', targetSets: 3, targetRepsMin: 5, targetRepsMax: 8 },   // Pull Up
                    { exerciseId: 'a3b4c5d6-e7f8-4a9b-9d0d-1e2f3a4b5c6d', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Hip Thrust
                    { exerciseId: 'c5d6e7f8-a9b0-4c1d-ae3f-4a5b6c7d8e9f', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Dumbbell Shoulder Press
                    { exerciseId: 'f8a9b0c1-d2e3-4f4a-9b6c-7d8e9f0a1b2c', targetSets: 2, targetRepsMin: 10, targetRepsMax: 12 }, // Barbell Curl
                ],
            },
            {
                name: 'Full Body – Day 3',
                exercises: [
                    { exerciseId: 'c9d0e1f2-a3b4-4c5d-8e7f-8a9b0c1d2e3f', targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },  // Leg Press
                    { exerciseId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Dumbbell Bench Press
                    { exerciseId: 'f6a7b8c9-d0e1-4f2a-bb4c-5d6e7f8a9b0c', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Lat Pulldown
                    { exerciseId: 'd0e1f2a3-b4c5-4d6e-bf8a-9b0c1d2e3f4a', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Bulgarian Split Squat
                    { exerciseId: 'e7f8a9b0-c1d2-4e3f-8a5b-6c7d8e9f0a1b', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 }, // Face Pull
                    { exerciseId: 'd2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', targetSets: 2, targetRepsMin: 12, targetRepsMax: 15 }, // Hammer Curl
                ],
            },
        ],
    },
    {
        id: 'featured-beginner',
        name: 'Beginner',
        abbreviation: 'BEG',
        color: '#34C759',
        tag: 'Beginner',
        daysPerWeek: 3,
        description: 'Simple full-body program focusing on fundamental movement patterns to build a strong foundation.',
        sessions: [
            {
                name: 'Beginner – Day A',
                exercises: [
                    { exerciseId: 'd9e0f2d5-3b2e-5f6d-0d4g-9b7c3e2g1f5b', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Barbell Squat
                    { exerciseId: 'b8d9f1c4-2a1d-4e5c-9c3f-8a6b2d1f0e4a', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Barbell Bench Press
                    { exerciseId: 'd4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f8a', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },  // Barbell Row
                    { exerciseId: 'b4c5d6e7-f8a9-4b0c-8d2e-3f4a5b6c7d8e', targetSets: 2, targetRepsMin: 10, targetRepsMax: 12 }, // Overhead Press
                    { exerciseId: 'e3f4a5b6-c7d8-4e9f-aa1b-2c3d4e5f6a7b', targetSets: 3, targetRepsMin: 1, targetRepsMax: 1 },   // Plank (time)
                ],
            },
            {
                name: 'Beginner – Day B',
                exercises: [
                    { exerciseId: 'e1f2a3b4-c5d6-4e7f-bf8b-9c0d1e2f3a4b', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Goblet Squat
                    { exerciseId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Dumbbell Bench Press
                    { exerciseId: 'f6a7b8c9-d0e1-4f2a-bb4c-5d6e7f8a9b0c', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Lat Pulldown
                    { exerciseId: 'c5d6e7f8-a9b0-4c1d-ae3f-4a5b6c7d8e9f', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Dumbbell Shoulder Press
                    { exerciseId: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', targetSets: 2, targetRepsMin: 12, targetRepsMax: 15 }, // Leg Curl
                ],
            },
            {
                name: 'Beginner – Day C',
                exercises: [
                    { exerciseId: 'c9d0e1f2-a3b4-4c5d-8e7f-8a9b0c1d2e3f', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Leg Press
                    { exerciseId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Incline Barbell Press
                    { exerciseId: 'a7b8c9d0-e1f2-4a3b-8c5d-6e7f8a9b0c1d', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Seated Cable Row
                    { exerciseId: 'b8c9d0e1-f2a3-4b4c-9d6e-7f8a9b0c1d2e', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 }, // Romanian Deadlift
                    { exerciseId: 'e3f4a5b6-c7d8-4e9f-aa1b-2c3d4e5f6a7b', targetSets: 3, targetRepsMin: 1, targetRepsMax: 1 },   // Plank (time)
                ],
            },
        ],
    },
];
