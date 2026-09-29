// MahaCollege 2.0 - Supabase configuration
// Replace the two placeholder values with your Supabase project values.
// Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = 'https://plamywjzprtxnmytxexe.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYW15d2p6cHJ0eG5teXR4ZXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1OTUzNjEsImV4cCI6MjEwNjE3MTM2MX0.RqWEZTw6Om8WFiSbvo59-HekPaEyxq6l2WwBw2zP7YI';

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
