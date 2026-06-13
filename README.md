# Soloise Frontend

## Run locally

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase keys
3. Install dependencies
4. Run `npm run dev`

## Login note

If Supabase auth fails with `Invalid API key`, the local environment is usually missing the Supabase values or using the wrong variable names. This project now accepts both:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`

For the admin client it accepts:

- `SUPABASE_SERVICE_ROLE_KEY`

