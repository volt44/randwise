import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kfmywziuxomnsomdfmop.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbXl3eml1eG9tbnNvbWRmbW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTQyODcsImV4cCI6MjA5MzM5MDI4N30.hH_vrWLeTGxXfhOIwn5rlNuR24bBoYv0zjaSvT5ZMyk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)