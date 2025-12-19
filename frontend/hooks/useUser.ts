"use client";

import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let supabase: ReturnType<typeof createClient> | null = null;
        let subscription: { unsubscribe: () => void } | null = null;

        const init = async () => {
            try {
                supabase = createClient();
            } catch (e) {
                console.error('Failed to create Supabase client:', e);
                setError('Supabase not configured');
                setLoading(false);
                return;
            }

            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);
                }
            } catch (e) {
                console.error('Failed to get session:', e);
            }
            setLoading(false);

            const { data } = supabase.auth.onAuthStateChange((_event: any, newSession: Session | null) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                setLoading(false);
            });
            subscription = data.subscription;
        };

        init();

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []); // Empty dependency array - only run once on mount

    const logout = useCallback(async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
        } catch (e) {
            console.error('Failed to sign out:', e);
        }
    }, []);

    return { user, session, loading, logout, error };
}
