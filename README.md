# Life OS

A personal goal, time and exam system. Next.js 14, TypeScript, Tailwind, Recharts. Works fully offline in the browser; optional Supabase cloud sync.

## Modules
Dashboard, Goals, Daily Planner, Calendar, Tasks, Examinations (syllabus, reverse plan), Mock Tests (charts, mistake journal), Reminders (browser notifications), Opportunities, Projects (Synth), Focus Mode, Analytics, Reviews, Settings, Account & Sync.

## Run locally
    npm install
    npm run dev      # http://localhost:3000
    npm run build    # production build check

No environment variables are needed. Data is stored in your browser's localStorage. Use Settings > Export JSON for backups.

## Put it on GitHub
1. Create an empty repository on github.com (no README, no .gitignore).
2. In the project folder:

        git init
        git add .
        git commit -m "Life OS"
        git branch -M main
        git remote add origin https://github.com/YOUR-USER/life-os.git
        git push -u origin main

`.env*.local` is git-ignored, so secrets are never uploaded.

## Deploy on Vercel
1. Sign in at vercel.com with GitHub.
2. Add New > Project > import the `life-os` repository.
3. Framework is detected as Next.js. Click Deploy.
4. To enable cloud sync, add the two environment variables below under Project > Settings > Environment Variables, then redeploy.

**Updating later:** edit code, then `git add . && git commit -m "message" && git push`. Vercel redeploys on every push to `main`.

## Cloud sync with Supabase (optional)
1. Create a project at supabase.com.
2. SQL Editor > paste `supabase/schema.sql` > Run. This creates one `user_data` table with row-level security, so each user can only read and write their own row.
3. Project Settings > API: copy the Project URL and the `anon` public key.
4. Set them locally in `.env.local` (copy `.env.example`) and in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Authentication > Providers: keep Email enabled. Authentication > URL Configuration: set Site URL to your Vercel URL. If "Confirm email" is on, new users must confirm before signing in.
6. Open Account & Sync in the app, create an account, sign in.

How sync works: your whole data set is stored as one record with a version number. Edits upload a few seconds after you make them. If another device saved a newer version, you are asked whether to keep the cloud copy or this device's copy. Nothing merges field by field. The anon key is designed to be public; row-level security is what protects the data.

## Install as an app
Open the deployed site in Chrome, Edge or Safari and use Install / Add to Home Screen. The service worker caches pages you have visited so the app opens offline; data always lives locally first.

## Notifications: what to expect
Browser notifications fire only while Life OS is open (a tab or the installed app). There is no push server. Alerts that came due while closed appear under Needs attention on the dashboard. Some mobile browsers only allow notifications for installed apps.

## Known limits
- Whole-document sync, last choice wins; no real-time collaboration.
- No drag-and-drop in the planner (edit start and duration inline).
- Emergency week regeneration and per-task postponement history are not implemented.
- Mocks and reminders are edited by delete and re-add beyond their inline fields.
