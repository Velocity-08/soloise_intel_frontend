# Soloise Frontend Redesign

A single-page dark dashboard built on the existing Supabase auth / key / analytics system.

## What stayed the same
- Supabase auth flow
- `/api/auth/signin`
- `/api/auth/signup`
- `/api/keys`
- `/api/keys/[id]`
- `/api/recommend`
- `getDashboardSnapshot()` and the current database tables

## What changed
- one main dashboard surface
- dark futuristic layout
- no separate docs/keys/playground navigation in the UI
- API key creation is embedded directly in the dashboard
- analytics stay on the same page

## Run
```bash
npm install
npm run dev
```

## Required environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SOLIOSE_BACKEND_URL` (optional, defaults to `http://localhost:8000`)
