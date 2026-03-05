import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const getSupabaseConfig = (): SupabaseConfig | null => {
  const stored = localStorage.getItem('joulecorp_supabase_config');
  if (stored) {
    try {
      const config = JSON.parse(stored);
      if (config.url && config.anonKey) return config;
    } catch { /* ignore */ }
  }
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && key) return { url, anonKey: key };
  return null;
};

export const isSupabaseConfigured = (): boolean => !!getSupabaseConfig();

export const getSupabase = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey);
  }
  return supabaseInstance;
};

export const resetSupabaseClient = () => {
  supabaseInstance = null;
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  localStorage.setItem('joulecorp_supabase_config', JSON.stringify({ url, anonKey }));
  resetSupabaseClient();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('joulecorp_supabase_config');
  resetSupabaseClient();
};
