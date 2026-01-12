
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppdyxsfpvbuyeytxclnr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHl4c2ZwdmJ1eWV5dHhjbG5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQ0MDIsImV4cCI6MjA4MTM1MDQwMn0.ktAgiGtEPunWTAQiIeKK9tif6Tb6g_8n0aMxaFf92WA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
