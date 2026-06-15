# Wall of Shame — pump.fun rug bulletin

A community rug-pull registry styled as a "most wanted" bulletin. Every entry is
on-chain: tokens, deployer wallets, extracted SOL, and verified behavior flags.
No personal identities, contact channels, or photos — wallets and public token
metadata only.

## What's wired

- **Reject feed → wall.** Your sniper calls `pushReject()` when it rejects a
  token; the wall reads those rows live from `/api/records`.
- **Verify gate → tips.** Community tips POST to `/api/report`, which pulls the
  wallet's Helius history, runs it through the Claude analyzer, and only lets
  chain-backed tips into the review queue. Unsupported tips never reach the board.
- **Manual approval.** Tips land as `pending` (hidden). You promote them to
  `confirmed` in Supabase. That human gate is intentional — keep it.

## Structure

    app/page.tsx            renders the bulletin
    app/api/records         GET — public records for the wall
    app/api/report          POST — verify gate for community tips
    components/WallOfShame   the bulletin UI
    lib/store.ts            Supabase read/upsert
    lib/chain.ts            Helius wallet-history fetch
    lib/analyzeDeployer.ts  Claude analysis + verifyReport
    bot/pushReject.ts       drop into your sniper repo
    db/schema.sql           run once in Supabase

## Setup

1. `npm install`
2. Create a Supabase project, run `db/schema.sql` in its SQL editor.
3. Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (Supabase project settings → API)
   - `ANTHROPIC_API_KEY` (console.anthropic.com)
   - `HELIUS_API_KEY` (your existing Helius key)
4. `npm run dev` → http://localhost:3000

## Deploy (Vercel)

Push to GitHub, import in Vercel, add the four env vars in project settings.
The API routes run as serverless functions; clients init lazily so the build
never needs the secrets.

## Bot integration

Copy `bot/pushReject.ts` and `lib/store.ts` into your sniper repo (it needs the
same `SUPABASE_URL` / `SUPABASE_SERVICE_KEY`). Then at reject time:

    import { pushReject } from "./bot/pushReject";
    await pushReject({ mint, deployer, name, ticker, reason, tags });
