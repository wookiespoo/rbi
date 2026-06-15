-- Shared store for the Wall of Shame.
-- The bot writes rejects here; the wall reads from here; submissions land here for review.
-- Run once in the Supabase SQL editor.

create table if not exists records (
  id           bigint generated always as identity primary key,
  name         text,
  ticker       text,
  token        text not null,                       -- mint
  deployer     text,                                -- wallet
  status       text not null default 'pending',     -- confirmed | flagged | pending | rejected
  source       text not null default 'community',   -- bot | manual | community
  reason       text,
  tags         text[] default '{}',
  project_x    text,
  sol_stolen   numeric,
  confidence   numeric,
  evidence_txs text[] default '{}',
  created_at   timestamptz default now()
);

-- one row per token; re-pushing a known mint updates it instead of duplicating
create unique index if not exists records_token_uniq on records (token);
create index if not exists records_status_idx   on records (status);
create index if not exists records_deployer_idx on records (deployer);
