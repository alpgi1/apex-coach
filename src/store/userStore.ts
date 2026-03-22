import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type WeightUnit = 'KG' | 'LBS';
type RestDuration = 60 | 90 | 120 | 180;

interface UserStoreState {
    weightUnit: WeightUnit;
    targetRIR: number;
    name: string;
    profilePhoto: string | null;
    restTimerDuration: RestDuration;
    autoStartRestTimer: boolean;

    setWeightUnit: (unit: WeightUnit) => void;
    setTargetRIR: (rir: number) => void;
    setName: (name: string) => void;
    setProfilePhoto: (uri: string | null) => void;
    setRestTimerDuration: (duration: RestDuration) => void;
    setAutoStartRestTimer: (enabled: boolean) => void;
}

export const useUserStore = create<UserStoreState>()(
    persist(
        (set) => ({
            weightUnit: 'KG',
            targetRIR: 2,
            name: '',
            profilePhoto: null,
            restTimerDuration: 90,
            autoStartRestTimer: true,

            setWeightUnit: (unit: WeightUnit) => set({ weightUnit: unit }),
            setTargetRIR: (rir: number) => set({ targetRIR: rir }),
            setName: (name: string) => set({ name }),
            setProfilePhoto: (uri: string | null) => set({ profilePhoto: uri }),
            setRestTimerDuration: (duration: RestDuration) => set({ restTimerDuration: duration }),
            setAutoStartRestTimer: (enabled: boolean) => set({ autoStartRestTimer: enabled }),
        }),
        {
            name: 'apex-user-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
