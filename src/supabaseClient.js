import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

if (supabaseAnonKey.startsWith('sb_secret_')) {
  throw new Error('Invalid Supabase key for frontend: use publishable/anon key, not sb_secret_.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
