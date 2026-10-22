/* supabaseClient.js */

// Project URL y anon public key del proyecto "practica-productos"
// (Project Settings → API Keys → Legacy anon, en el panel de Supabase).
// La anon key es PÚBLICA: está hecha para viajar al navegador. Lo que
// controla qué puede hacer es RLS (sección 3.4).
const SUPABASE_URL      = "https://lkfzrssjpqmthupthaxl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZnpyc3NqcHFtdGh1cHRoYXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzM0MzAsImV4cCI6MjEwNzc0OTQzMH0.t67hNOcOlQW9Aq-kImoROpvhQPxVmt_Jb52zy9U9C-0";

// El script del CDN crea la variable global "supabase", que trae
// createClient(). Nuestro cliente se llama "db" para NO sobreescribir
// ese objeto global de la librería.
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
