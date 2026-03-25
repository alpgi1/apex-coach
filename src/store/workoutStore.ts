import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { ExerciseLog, WorkoutSession, WorkoutSet } from '../types/workout.types';

interface WorkoutStoreState {
    activeSession: WorkoutSession | null;
    isWorkoutActive: boolean;

    startSession: (name: string) => void;
    endSession: () => void;
    setSessionNotes: (notes: string) => void;
    addExerciseLog: (log: ExerciseLog) => void;
    addSet: (exerciseLogId: string, set: WorkoutSet) => void;
    insertSetAtStart: (exerciseLogId: string, set: WorkoutSet) => void;
    updateSet: (exerciseLogId: string, set: WorkoutSet) => void;
    removeSet: (exerciseLogId: string, setId: string) => void;
}

export const useWorkoutStore = create<WorkoutStoreState>((set) => ({
    activeSession: null,
    isWorkoutActive: false,

    startSession: (name: string) => {
        const newSession: WorkoutSession = {
            id: Crypto.randomUUID(),
            name,
            startTime: new Date().toISOString(),
            endTime: null,
            volumeKg: 0,
            logs: [],
            averageRPE: null,
        };

        set({
            activeSession: newSession,
            isWorkoutActive: true,
        });
    },

    endSession: () => {
        set((state) => {
            if (!state.activeSession) return state;

            let totalVolumeKg = 0;
            let totalRpe = 0;
            let rpeCount = 0;

            for (const log of state.activeSession.logs) {
                for (const workoutSet of log.sets) {
                    if (workoutSet.isCompleted && (workoutSet.setType === 'WORKING' || workoutSet.setType === 'DROP')) {
                        totalVolumeKg += workoutSet.weightKg * workoutSet.reps;

                        if (workoutSet.rpe) {
                            totalRpe += workoutSet.rpe;
                            rpeCount++;
                        }
                    }
                }
            }

            const averageRPE = rpeCount > 0 ? Number((totalRpe / rpeCount).toFixed(1)) : null;

            return {
                activeSession: {
                    ...state.activeSession,
                    endTime: new Date().toISOString(),
                    volumeKg: totalVolumeKg,
                    averageRPE,
                },
                isWorkoutActive: false,
            };
        });
    },

    setSessionNotes: (notes: string) => {
        set((state) => {
            if (!state.activeSession) return state;
            return { activeSession: { ...state.activeSession, notes } };
        });
    },

    addExerciseLog: (log: ExerciseLog) => {
        set((state) => {
            if (!state.activeSession) return state;

            return {
                activeSession: {
                    ...state.activeSession,
                    logs: [...state.activeSession.logs, log],
                },
            };
        });
    },

    addSet: (exerciseLogId: string, newSet: WorkoutSet) => {
        set((state) => {
            if (!state.activeSession) return state;

            const updatedLogs = state.activeSession.logs.map((log) => {
                if (log.id === exerciseLogId) {
                    return {
                        ...log,
                        sets: [...log.sets, newSet],
                    };
                }
                return log;
            });

            return {
                activeSession: {
                    ...state.activeSession,
                    logs: updatedLogs,
                },
            };
        });
    },

    insertSetAtStart: (exerciseLogId: string, newSet: WorkoutSet) => {
        set((state) => {
            if (!state.activeSession) return state;

            const updatedLogs = state.activeSession.logs.map((log) => {
                if (log.id === exerciseLogId) {
                    const allSets = [newSet, ...log.sets];
                    return {
                        ...log,
                        sets: allSets.map((s, i) => ({ ...s, setNumber: i + 1 })),
                    };
                }
                return log;
            });

            return {
                activeSession: {
                    ...state.activeSession,
                    logs: updatedLogs,
                },
            };
        });
    },

    removeSet: (exerciseLogId: string, setId: string) => {
        set((state) => {
            if (!state.activeSession) return state;

            const updatedLogs = state.activeSession.logs.map((log) => {
                if (log.id !== exerciseLogId) return log;
                const filtered = log.sets
                    .filter((s) => s.id !== setId)
                    .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
                return { ...log, sets: filtered };
            });

            return { activeSession: { ...state.activeSession, logs: updatedLogs } };
        });
    },

    updateSet: (exerciseLogId: string, updatedSet: WorkoutSet) => {
        set((state) => {
            if (!state.activeSession) return state;

            const updatedLogs = state.activeSession.logs.map((log) => {
                if (log.id === exerciseLogId) {
                    return {
                        ...log,
                        sets: log.sets.map((s) => (s.id === updatedSet.id ? updatedSet : s)),
                    };
                }
                return log;
            });

            return {
                activeSession: {
                    ...state.activeSession,
                    logs: updatedLogs,
                },
            };
        });
    },
}));
