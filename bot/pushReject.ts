// bot/pushReject.ts — call this from your sniper the moment it rejects a token.
// It writes the reject straight to the same store the wall reads, as a
// bot-flagged entry (amber on the wall). No API hop; the bot is trusted.
//
// Wire it in wherever your filters return "reject":
//   if (verdict === "reject") {
//     await pushReject({ mint, deployer, name, ticker, reason, tags });
//   }

import { upsertRecord } from "../lib/store";

export interface BotReject {
  mint: string;
  deployer?: string;
  name?: string;
  ticker?: string;
  reason?: string;       // which filter tripped, in plain words
  tags?: string[];       // e.g. ["Wash-traded own token", "Deployer blacklisted"]
  solExtracted?: number | null;
}

export async function pushReject(r: BotReject) {
  try {
    await upsertRecord({
      token: r.mint,
      deployer: r.deployer,
      name: r.name,
      ticker: r.ticker,
      reason: r.reason,
      tags: r.tags ?? [],
      solStolen: r.solExtracted ?? null,
      source: "bot",
      status: "flagged", // bot-rejected, unproven -> amber. Promote to "confirmed" once a rug is verified.
    });
  } catch (err) {
    console.error("pushReject failed for", r.mint, err);
  }
}
