import * as Crypto from 'expo-crypto';
import { saveWorkoutSession } from '../services/storage/workoutStorage';
import { postWorkout } from '../services/api/workoutApi';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { ExerciseLog, RPEScale, WorkoutSet } from '../types/workout.types';

export const useWorkoutSession = () => {
    const store = useWorkoutStore();

    const startWorkout = (name: string): void => {
        store.startSession(name);
    };

    const finishWorkout = async (): Promise<void> => {
        // We need to capture the active session before ending it, because
        // endSession mutates the state (sets endTime, volume, averageRPE)
        // and clears out isWorkoutActive

        // Technically ending the session doesn't "clear" the active session data,
        // it just finalizes the stats.
        store.endSession();

        // The store's endSession is synchronous, but React state updates are batched.
        // However, Zustand allows us to immediately read the updated state right off the store:
        const finalizedSession = useWorkoutStore.getState().activeSession;

        if (!finalizedSession) return;

        try {
            await saveWorkoutSession(finalizedSession);
        } catch (error) {
            console.error('Failed to save workout:', error);
            throw error;
        }

        // Fire-and-forget backend sync — does not block UX
        if (useAuthStore.getState().session) {
            postWorkout(finalizedSession).catch((err) =>
                console.warn('Backend workout sync failed (non-blocking):', err)
            );
        }
    };

    const addExercise = (exerciseId: string): string => {
        const order = store.activeSession ? store.activeSession.logs.length : 0;

        const newLog: ExerciseLog = {
            id: Crypto.randomUUID(),
            exerciseId,
            order,
            sets: [],
        };

        store.addExerciseLog(newLog);
        return newLog.id;
    };

    const addEmptySets = (exerciseLogId: string, count: number): void => {
        for (let i = 0; i < count; i++) {
            const fresh = useWorkoutStore.getState().activeSession;
            const existingLog = fresh?.logs.find((l) => l.id === exerciseLogId);
            const setNumber = existingLog ? existingLog.sets.length + 1 : i + 1;
            const emptySet: WorkoutSet = {
                id: Crypto.randomUUID(),
                setNumber,
                weightKg: 0,
                reps: 0,
                rpe: undefined,
                setType: 'WORKING',
                isCompleted: false,
            };
            store.addSet(exerciseLogId, emptySet);
        }
    };

    const logSet = (
        exerciseLogId: string,
        weight: number,
        reps: number,
        rpe: RPEScale | number
    ): void => {
        // We need to know what setNumber this is going to be
        const existingLog = store.activeSession?.logs.find((l) => l.id === exerciseLogId);
        const setNumber = existingLog ? existingLog.sets.length + 1 : 1;

        const newSet: WorkoutSet = {
            id: Crypto.randomUUID(),
            setNumber,
            weightKg: weight,
            reps,
            rpe: rpe as RPEScale, // We safely cast because the UI guarantees RPEScale step precision
            setType: 'WORKING',
            isCompleted: false,
        };

        store.addSet(exerciseLogId, newSet);
    };

    const completeSet = (exerciseLogId: string, setId: string): void => {
        // Read fresh state to avoid stale closure (e.g. when called right after updateSetValues)
        const fresh = useWorkoutStore.getState().activeSession;
        const existingLog = fresh?.logs.find((l) => l.id === exerciseLogId);
        if (!existingLog) return;

        const existingSet = existingLog.sets.find((s) => s.id === setId);
        if (!existingSet) return;

        store.updateSet(exerciseLogId, {
            ...existingSet,
            isCompleted: !existingSet.isCompleted,
        });
    };

    const removeSet = (exerciseLogId: string, setId: string): void => {
        const fresh = useWorkoutStore.getState().activeSession;
        const log = fresh?.logs.find((l) => l.id === exerciseLogId);
        if (!log || log.sets.length <= 1) return;
        store.removeSet(exerciseLogId, setId);
    };

    const updateSetValues = (
        exerciseLogId: string,
        setId: string,
        weight: number,
        reps: number,
        rpe?: number
    ): void => {
        // Read fresh state to avoid stale closure
        const fresh = useWorkoutStore.getState().activeSession;
        const existingLog = fresh?.logs.find((l) => l.id === exerciseLogId);
        if (!existingLog) return;

        const existingSet = existingLog.sets.find((s) => s.id === setId);
        if (!existingSet) return;

        store.updateSet(exerciseLogId, {
            ...existingSet,
            weightKg: weight,
            reps,
            rpe: rpe as RPEScale | undefined,
        });
    };

    return {
        // Expose all Zustand state and actions natively
        ...store,

        // Expose custom hook wrappers that integrate SQLite side effects
        startWorkout,
        finishWorkout,
        addExercise,
        addEmptySets,
        logSet,
        completeSet,
        updateSetValues,
        removeSet,
    };
};
