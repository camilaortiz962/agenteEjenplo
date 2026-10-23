/* supabaseClient.example.js — plantilla SIN credenciales.
   Cópiala como supabaseClient.js (ignorado por git) y pega tus datos. */

// Pega aquí tu Project URL y tu anon public key
// (Project Settings → API, en el panel de Supabase)
const SUPABASE_URL      = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU-ANON-KEY";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
