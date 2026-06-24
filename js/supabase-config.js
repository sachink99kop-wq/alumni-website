// ============================================================
//  Supabase Client Initialisation
// ============================================================
//  1. Create a project at https://supabase.com
//  2. Project Settings -> API -> copy the "Project URL" and the
//     "anon / public" key and paste them below.
//  3. Run the SQL found in README.md to create the tables.
//  4. Set the RLS policies described in README.md.
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://odgqktvzmbtqhuubrtln.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZ3FrdHZ6bWJ0cWh1dWJydGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTA3NTMsImV4cCI6MjA5Nzg2Njc1M30.c9U93SpbFRDQV6yorqtMkak54pHJS72hxVUdAj0yo_o'

// A small flag other scripts can use to show a friendly notice
// if the credentials have not been filled in yet.
export const isConfigured =
  SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
