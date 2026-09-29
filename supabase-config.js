// MahaCollege - Supabase configuration
// IMPORTANT: Copy these values from Supabase Dashboard -> Project Settings -> API.
// Project URL must be ONLY https://<project-ref>.supabase.co
// Do not add /auth, /v1, /signup, /rest, or a trailing path.
const SUPABASE_URL = 'https://plamywjzprtxnmytxexe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYW15d2p6cHJ0eG5teXR4ZXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1OTUzNjEsImV4cCI6MjEwNjE3MTM2MX0.RqWEZTw6Om8WFiSbvo59-HekPaEyxq6l2WwBw2zP7YI';

try {
    const parsed = new URL(SUPABASE_URL);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co') || parsed.pathname !== '/') {
        throw new Error('Invalid Supabase Project URL. Use the exact Project URL from Supabase -> Project Settings -> API.');
    }
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error('MahaCollege Supabase configuration error:', error);
    window.supabaseClient = null;
    window.supabaseConfigError = error.message;
}
