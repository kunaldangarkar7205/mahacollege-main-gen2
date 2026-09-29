# MahaCollege Supabase Authentication Setup

This project uses Supabase Auth for Login, Create Account and Forgot Password.

## 1. Project URL and key

Open Supabase Dashboard -> your project -> Project Settings -> API.

In `supabase-config.js`:
- `SUPABASE_URL` must be exactly the Project URL, such as `https://YOUR_PROJECT_REF.supabase.co`.
- `SUPABASE_ANON_KEY` must be the current Publishable/Anon key from the same project.
- Do not append `/auth`, `/v1`, `/signup`, `/rest`, or another path to the Project URL.

## 2. Email provider

Open Authentication -> Providers -> Email and make sure Email is enabled.

## 3. GitHub Pages URLs

For this project the deployed base is:
`https://kunaldangarkar7205.github.io/mahacollege-main`

Set Site URL to:
`https://kunaldangarkar7205.github.io/mahacollege-main`

Add this Redirect URL:
`https://kunaldangarkar7205.github.io/mahacollege-main/reset-password.html`

## 4. Database

Run `supabase/schema.sql` once in Supabase SQL Editor. It creates the optional profile, favorite and prediction-history tables and their RLS policies.

## 5. Expected flows

Create Account -> Login -> Front Page

Login -> Front Page

Forgot Password -> Email -> Reset Password -> Login

Opening any protected college page without a session -> Login
