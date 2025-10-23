// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;       // set in Vercel/Render
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY; // set in Vercel/Render

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
