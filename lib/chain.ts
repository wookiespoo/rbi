// lib/chain.ts — pull a wallet's recent on-chain activity for the verify gate.
// Uses Helius parsed-transaction history (same RPC you already run).

import type { WalletEvent } from "./analyzeDeployer";

export async function getWalletEvents(wallet: string, limit = 100): Promise<WalletEvent[]> {
  const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${process.env.HELIUS_API_KEY}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Helius ${res.status}`);
  const txns = (await res.json()) as any[];

  const events: WalletEvent[] = [];
  for (const tx of txns) {
    const sig = tx.signature;
    const time = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : undefined;

    for (const nt of tx.nativeTransfers ?? []) {
      events.push({
        signature: sig,
        action: tx.type ?? "TRANSFER",
        from: nt.fromUserAccount,
        to: nt.toUserAccount,
        amount: (nt.amount ?? 0) / 1e9, // lamports -> SOL
        token: "SOL",
        time,
      });
    }
    for (const tt of tx.tokenTransfers ?? []) {
      events.push({
        signature: sig,
        action: tx.type ?? "TRANSFER",
        from: tt.fromUserAccount,
        to: tt.toUserAccount,
        amount: tt.tokenAmount ?? 0,
        token: tt.mint, // analyzer keys behavior off SOL vs token mint
        time,
      });
    }
  }
  return events;
}
