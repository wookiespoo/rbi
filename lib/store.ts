// lib/store.ts — the one place that touches the DB.
// Uses the service-role key, so this module is SERVER-SIDE ONLY.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy client: only instantiated at request time, so `next build` never
// needs the env vars and serverless cold starts stay clean.
let _sb: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!_sb) {
    _sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  }
  return _sb;
}

export interface RecordInput {
  name?: string;
  ticker?: string;
  token: string;
  deployer?: string;
  status?: "confirmed" | "flagged" | "pending" | "rejected";
  source?: "bot" | "manual" | "community";
  reason?: string;
  tags?: string[];
  projectX?: string;
  solStolen?: number | null;
  confidence?: number | null;
  evidenceTxs?: string[];
}

// Shape the wall component already expects (camelCase + `date`).
function toUi(row: any) {
  return {
    id: row.id,
    name: row.name,
    ticker: row.ticker,
    token: row.token,
    deployer: row.deployer,
    status: row.status,
    source: row.source,
    reason: row.reason,
    tags: row.tags ?? [],
    projectX: row.project_x,
    solStolen: row.sol_stolen != null ? Number(row.sol_stolen) : null,
    date: (row.created_at ?? "").slice(0, 10),
  };
}

/** Public wall: confirmed + bot-flagged only. Pending/rejected stay hidden. */
export async function listPublicRecords() {
  const { data, error } = await sb()
    .from("records")
    .select("*")
    .in("status", ["confirmed", "flagged"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toUi);
}

/** Insert or update by token mint. */
export async function upsertRecord(rec: RecordInput) {
  const { error } = await sb().from("records").upsert(
    {
      name: rec.name,
      ticker: rec.ticker,
      token: rec.token,
      deployer: rec.deployer,
      status: rec.status ?? "pending",
      source: rec.source ?? "community",
      reason: rec.reason,
      tags: rec.tags ?? [],
      project_x: rec.projectX,
      sol_stolen: rec.solStolen ?? null,
      confidence: rec.confidence ?? null,
      evidence_txs: rec.evidenceTxs ?? [],
    },
    { onConflict: "token" },
  );
  if (error) throw error;
}
