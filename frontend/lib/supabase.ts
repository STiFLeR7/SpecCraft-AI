import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null;

export const createClient = () => {
    if (supabaseClient) return supabaseClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables:', {
            NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'set' : 'missing',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'set' : 'missing'
        });
        // Return a dummy client that won't crash but won't work either
        // This allows the app to at least render
        throw new Error('Supabase not configured');
    }

    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
}
