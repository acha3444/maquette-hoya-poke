import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gfdkjcxcowztlbjfdlfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZGtqY3hjb3d6dGxiamZkbGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTE5NTUsImV4cCI6MjEwNzI4Nzk1NX0.f7jxHf8q-0YXbLFffMuW9mr2NdKmdAMWWa6VQtQ08Mc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
