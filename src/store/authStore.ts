import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
    session: Session | null;
    isLoading: boolean;
    isInitialized: boolean;
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    isLoading: false,
    isInitialized: false,

    initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        set({ session, isInitialized: true });

        supabase.auth.onAuthStateChange((_event, session) => {
            set({ session });
        });
    },

    signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    signUp: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
    },
}));
