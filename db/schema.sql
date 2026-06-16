-- Records store for RBI — Rug Bureau of Investigation.
-- The wall reads from here; submissions land here for review.
-- Run once in the Supabase SQL editor.

create table if not exists records (
  id           bigint generated always as identity primary key,
  name         text,
  ticker       text,
  token        text not null,                       -- mint
  deployer     text,                                -- wallet
  status       text not null default 'pending',     -- confirmed | flagged | pending | rejected
  source       text not null default 'community',   -- screen | manual | community
  reason       text,
  tags         text[] default '{}',
  project_x    text,
  sol_stolen   numeric,
  confidence   numeric,
  evidence_txs text[] default '{}',
  image_url    text,                                -- proof screenshot (public URL)
  submitter_wallet text,                            -- bounty payout wallet (community submitter)
  created_at   timestamptz default now()
);

-- one row per token; re-submitting a known mint updates it instead of duplicating
create unique index if not exists records_token_uniq on records (token);
create index if not exists records_status_idx   on records (status);
create index if not exists records_deployer_idx on records (deployer);

-- ---------------------------------------------------------------------------
-- Evidence image storage. Run this too (or create the bucket in the dashboard:
-- Storage -> New bucket -> name "evidence" -> Public).
-- The server uploads with the service-role key (bypasses RLS); public = true
-- makes the screenshots viewable on the wall.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;
