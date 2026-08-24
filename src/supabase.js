import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "[Supabase] Variables manquantes : VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY. Utilisation de valeurs temporaires."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
