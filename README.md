# Soloise Frontend

## Run

1. Copy `.env.example` to `.env.local`
2. Add your Supabase URL, anon key, and service role key
3. Install dependencies
4. Run `npm run dev`

## Notes

- `middleware.ts` handles Supabase session refresh and clears stale refresh-token cookies.
- `app/globals.css` contains the missing global styles that keep the landing page from rendering plain white.
- The dashboard expects these tables in Supabase:
  - `credit_balances`
  - `api_keys`
  - `usage_logs`
