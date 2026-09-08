# Household Manager

## Storage options

The default `self-hosted` setting keeps the household location, weather-aware tasks, chores, and shopping list in `.data/household-manager.db` on the machine running Next.js. It needs no Supabase account or keys. Keep this server on a trusted private network; this lightweight mode has no user accounts.

To require a household PIN, add `HOUSEHOLD_ACCESS_PIN` and a long, unique `HOUSEHOLD_SESSION_SECRET` to `.env.local`, then restart the server. The PIN gate protects the self-hosted data API with an HTTP-only signed session cookie. Do not expose the app to the public internet without a full authentication layer and HTTPS.

Set `NEXT_PUBLIC_HOUSEHOLD_STORAGE=local` to keep these lists only in the current browser, or set it to `supabase` to enable the hosted setup below.

## Supabase hosted setup

1. Create a Supabase project and copy its project URL and publishable key into `.env.local`, using `.env.example` as the template.
2. Apply both files in `supabase/migrations/` in timestamp order, through the Supabase SQL Editor or CLI.
3. In Supabase Auth, enable Email sign-in and add `http://localhost:3000/auth/callback` to the allowed redirect URLs for local development.
4. Run `npm run dev` and visit `/sign-in`.

When `NEXT_PUBLIC_HOUSEHOLD_STORAGE=supabase` and the keys are present, household locations, weather tasks, recurring chores, and shopping items use Supabase Postgres with Row Level Security. Browser device coordinates are never sent to Postgres.

## Weather CLI

Run `npm run weather` to print the forecast for the saved self-hosted household location. You can also look up a place without changing the saved location:

```sh
npm run weather -- --city "Boston, MA"
npm run weather -- --latitude 42.3601 --longitude -71.0589 --timezone America/New_York
```

Add `--json` for the complete forecast payload. The CLI uses Open-Meteo directly and requires an internet connection.
