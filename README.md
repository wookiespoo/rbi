# RBI — Rug Bureau of Investigation

A community rug-pull registry for pump.fun, styled as a "most wanted" bulletin.
Every entry is built from public data: token mints, deployer wallets, extracted
SOL, observed behavior flags, the channels the coin itself listed on its
pump.fun page (its X / site / Telegram), and an optional screenshot of that page
as proof. The board surfaces a token's OWN public metadata and on-chain facts --
it does not collect a private person's contact details or name who someone is.

## What's wired

- **Public wall.** `/api/records` serves the confirmed + flagged entries; the
  bulletin reads them on load, with an offline seed on first paint.
- **AI verify gate.** Tips POST to `/api/report`. The deployer wallet's Helius
  history runs through the Claude analyzer for an on-chain verdict.
- **Proof screenshots.** A submitter can attach a pump.fun / chart / explorer
  screenshot. Claude's vision model screens every image: it must be a real
  token-page screenshot, with no person's face and nothing unsafe, or the whole
  submission is refused before anything is stored. Accepted images go to
  Supabase Storage and show as an exhibit on the poster.
- **Known channel.** The poster links the X / socials the token itself listed on
  pump.fun -- the account that promoted the coin, not a private individual.
- **Acceptance + manual approval.** A submission enters the queue only if the
  chain backs it or a verified screenshot is attached -- then it sits as
  `pending` (hidden) until you promote it to `confirmed` in Supabase. Keep that
  human gate.

## Structure

    app/page.tsx            renders the bulletin
    app/api/records         GET -- public records for the wall
    app/api/report          POST -- verify gate (chain + image) for tips
    components/WallOfShame   the bulletin UI + submit form
    lib/store.ts            Supabase read/upsert + evidence upload
    lib/chain.ts            Helius wallet-history fetch
    lib/analyzeDeployer.ts  Claude analysis + verifyReport + image screen
    db/schema.sql           run once in Supabase (table + evidence bucket)

## Setup

1. `npm install`
2. Create a Supabase project and run `db/schema.sql` in its SQL editor -- it
   creates the `records` table and the public `evidence` storage bucket.
3. Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (Supabase settings -> API)
   - `ANTHROPIC_API_KEY` (console.anthropic.com)
   - `HELIUS_API_KEY`
4. `npm run dev` -> http://localhost:3000

## Deploy (Vercel)

Push to GitHub, import in Vercel, add the four env vars in project settings.
Clients init lazily so the build never needs the secrets. `.env` is gitignored.
