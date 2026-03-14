import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type WeightUnit = 'KG' | 'LBS';

interface UserStoreState {
    weightUnit: WeightUnit;
    targetRIR: number;
    name: string;
    profilePhoto: string | null;

    setWeightUnit: (unit: WeightUnit) => void;
    setTargetRIR: (rir: number) => void;
    setName: (name: string) => void;
    setProfilePhoto: (uri: string | null) => void;
}

export const useUserStore = create<UserStoreState>()(
    persist(
        (set) => ({
            weightUnit: 'KG',
            targetRIR: 2,
            name: '',
            profilePhoto: null,

            setWeightUnit: (unit: WeightUnit) => set({ weightUnit: unit }),
            setTargetRIR: (rir: number) => set({ targetRIR: rir }),
            setName: (name: string) => set({ name }),
            setProfilePhoto: (uri: string | null) => set({ profilePhoto: uri }),
        }),
        {
            name: 'apex-user-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
