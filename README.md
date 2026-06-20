# Soloise Frontend

A single-page premium dashboard for API keys, credits, and live usage analytics.
Pure-black Vercel-style minimalism with an orange + yellow brand accent.

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- Supabase (auth + DB) — server-side via `@supabase/ssr`
- lucide-react for icons
- Custom SVG bar chart (no chart deps)

## Run locally

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
# fill in your Supabase keys

# 3. Dev
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

The app accepts either of these naming conventions for Supabase:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`

Service role (admin client, used by API routes that mint API keys):

- `SUPABASE_SERVICE_ROLE_KEY`

The `/api/recommend` proxy requires:

- `SOLIOSE_BACKEND_URL` — origin of your backend (e.g. `https://soloise-intel.vercel.app`)

## Routes

| Path                    | What it does                                      |
| ----------------------- | ------------------------------------------------- |
| `/`                     | Dashboard (locked preview when logged out)        |
| `/dashboard`            | Same as `/`                                       |
| `/auth`                 | Sign in / Sign up (split-screen design)           |
| `/auth/callback`        | OAuth callback for Google                         |
| `/api/auth/signin`      | Email/password sign-in                            |
| `/api/auth/signup`      | Email/password sign-up                            |
| `/api/keys` (GET/POST)  | List or create API keys                           |
| `/api/keys/[id]` DELETE | Revoke an API key                                 |
| `/api/recommend`        | Proxy to the upstream backend                     |

The legacy `/dashboard/{keys,docs,playground}` routes redirect to `/dashboard`.

## What changed in this redesign

- Pure black `#000` background, no card blur, no chunky pills
- 1px hairline borders (Vercel-style) at `rgba(255,255,255,0.08)`
- Orange (`#FF5C1F`) primary, yellow (`#F5C518`) secondary
- Interactive stacked bar chart with hover tooltip (`components/usage-chart.tsx`)
- Bracket-frame metric cards (`components/bracket-card.tsx`)
- Compact 56px topbar with avatar dropdown (email, credits bar, sign out)
- Auth page redesigned: orange/yellow glow panel + 3 step cards + dark form
- Fully responsive — stat row collapses to 2-up then 1-up; chart, tables, and tooltips all scale

## Project structure

```
soloise-frontend/
├── app/
│   ├── api/{auth,keys,recommend}/...   # backend (unchanged contracts)
│   ├── auth/                            # /auth + /auth/callback
│   ├── dashboard/                       # /dashboard + legacy redirects
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth-form.tsx                    # redesigned
│   ├── bracket-card.tsx                 # new
│   ├── dashboard-shell.tsx              # compat stub
│   ├── dashboard-view.tsx               # redesigned
│   ├── key-manager.tsx                  # compat stub
│   ├── playground-client.tsx            # compat stub
│   ├── site-topbar.tsx                  # redesigned with avatar popup
│   └── usage-chart.tsx                  # new — interactive SVG bars
├── lib/
│   ├── dashboard.ts
│   └── supabase/{admin,browser,env,server}.ts
├── middleware.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```
