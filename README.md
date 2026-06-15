# RBI — Rug Bureau of Investigation

A community rug-pull registry for pump.fun, styled as a "most wanted" bulletin.
Every entry is on-chain: tokens, deployer wallets, extracted SOL, and observed
behavior flags. No personal identities, contact channels, or photos — wallets
and public token metadata only.

## What's wired

- **Public wall.** `/api/records` serves confirmed + flagged entries; the
  bulletin reads them on load. An offline seed shows immediately on first paint.
- **Verify gate -> tips.** Community tips POST to `/api/report`, which pulls the
  wallet's Helius history, runs it through the Claude analyzer, and only lets
  chain-backed tips into the review queue. Unsupported tips never reach the board.
- **Manual approval.** Tips land as `pending` (hidden). You promote them to
  `confirmed` in Supabase. That human gate is intentional — keep it.

## Setup

1. `npm install`
2. Create a Supabase project, run `db/schema.sql` in its SQL editor.
   (Optional: run `db/seed.sql` to preload starter entries.)
3. Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (Supabase settings -> API)
   - `ANTHROPIC_API_KEY` (console.anthropic.com)
   - `HELIUS_API_KEY`
4. `npm run dev` -> http://localhost:3000

## Deploy (Vercel)

Push to GitHub, import in Vercel, add the four env vars in project settings.
Clients init lazily so the build never needs the secrets. `.env` is gitignored —
keys never leave your machine.
