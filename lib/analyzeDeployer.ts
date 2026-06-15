/**
 * analyzeDeployer.ts — the "smart" layer for the Wall of Shame.
 *
 * Server-side only. Never call this from the browser; your ANTHROPIC_API_KEY
 * must stay in an env var on Vercel/Railway, never shipped to the client.
 *
 * It takes a wallet's normalized on-chain events and returns a structured,
 * data-grounded verdict. The system prompt forces three disciplines:
 *   1. Only claim what the events support — otherwise return "inconclusive".
 *   2. Count SOL extracted from creator-fee claims and confirmed sells ONLY,
 *      never from buys or token transfers (that's the wash-trade trap).
 *   3. On-chain + token metadata only. No personal identities, names, faces,
 *      or contact channels — the model never invents who someone "is".
 *
 * Docs: https://docs.claude.com/en/api/overview
 */

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

// One normalized event from a Solscan/Helius export.
export interface WalletEvent {
  signature: string;
  action: string;        // "TRANSFER" | "CREATE ACCOUNT" | "CLOSE ACCOUNT" | "CREATOR FEE" ...
  from: string;
  to: string;
  amount: number;
  token: string;         // "SOL" | "WSOL" | ticker
  valueUsd?: number | null;
  time?: string;
}

export interface DeployerInput {
  wallet: string;
  tokenName?: string;
  tokenTicker?: string;
  tokenMint?: string;
  athMarketCap?: number;
  currentMarketCap?: number;
  events: WalletEvent[];
}

export interface Analysis {
  verdict: "confirmed_rug" | "likely_rug" | "suspicious" | "inconclusive";
  confidence: number;          // 0..1
  summary: string;             // one short paragraph, neutral, chain-grounded
  tags: string[];              // each independently provable from the events
  solExtracted: number | null; // creator fees + confirmed sells only
  evidenceTxs: string[];       // signatures backing the verdict
}

const SYSTEM = `You are an on-chain forensic analyst for a rug-pull registry.
You receive a single wallet's normalized transaction events and token context.
Analyze ONLY what is in the events. You have no other knowledge of this wallet.

Rules:
- If the events do not clearly support a rug, return verdict "inconclusive". Do not guess.
- Classify behaviors precisely:
  * Self-buys of the wallet's own token (SOL out, token in, repeated) = WASH TRADING, not extraction.
  * "Creator fee" / fee-claim inflows = extraction.
  * Token sold INTO a pool for SOL = a dump = extraction.
  * Token transferred OUT to another wallet = a bag move, NOT yet a realized dump.
- solExtracted: sum ONLY creator-fee claims and confirmed token-sold-for-SOL events.
  NEVER count buys, generic receives, or token transfers. If none, return null.
- Every tag must be provable from specific events. Put their signatures in evidenceTxs.
- On-chain and token-metadata facts ONLY. Never output a person's name, real identity,
  social handle, face, or contact info. Never speculate about who controls the wallet.
- Output a single JSON object and nothing else. No prose, no code fences.

JSON shape:
{"verdict": "...", "confidence": 0.0, "summary": "...", "tags": ["..."], "solExtracted": null, "evidenceTxs": ["..."]}`;

function parseJson(text: string): Analysis {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as Analysis;
}

export async function analyzeDeployer(input: DeployerInput): Promise<Analysis> {
  try {
    const msg = await client().messages.create({
      // Sonnet for nuanced dossiers/verification; swap to
      // "claude-haiku-4-5-20251001" for cheap high-volume triage of bot rejects.
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return parseJson(text);
  } catch (err) {
    // Fail closed: never fabricate a verdict if the model/parse fails.
    console.error("analyzeDeployer failed:", err);
    return {
      verdict: "inconclusive",
      confidence: 0,
      summary: "Analysis unavailable — could not verify against on-chain data.",
      tags: [],
      solExtracted: null,
      evidenceTxs: [],
    };
  }
}

/**
 * Submission gate — the false-accusation filter.
 * Returns true only if the on-chain events actually back the claim.
 * Use this before a community report enters the review queue.
 */
export async function verifyReport(
  claim: string,
  input: DeployerInput,
): Promise<{ supported: boolean; reason: string; analysis: Analysis }> {
  const analysis = await analyzeDeployer(input);
  const supported =
    analysis.verdict !== "inconclusive" &&
    analysis.confidence >= 0.6 &&
    analysis.evidenceTxs.length > 0;
  return {
    supported,
    reason: supported
      ? "On-chain events support the report."
      : "Not enough on-chain evidence — held for manual review.",
    analysis,
  };
}

/* ---------------------------------------------------------------------------
 * Example Next.js (App Router) API route — app/api/analyze/route.ts
 *
 * import { NextResponse } from "next/server";
 * import { analyzeDeployer, DeployerInput } from "@/lib/analyzeDeployer";
 *
 * export async function POST(req: Request) {
 *   const input = (await req.json()) as DeployerInput;
 *   const analysis = await analyzeDeployer(input);
 *   return NextResponse.json(analysis);
 * }
 * ------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------
 * Evidence image screen — the vision gate for uploaded proof.
 *
 * A submitted image is ONLY allowed if it is a screenshot of a token page,
 * chart, DEX/terminal, or block explorer. Anything that is a photo of a
 * person, a face, or unsafe content is rejected before it can be stored.
 * This keeps the board a wall of on-chain receipts, not a board of faces.
 * ------------------------------------------------------------------------- */

export interface ImageCheck {
  isEvidence: boolean; // pump.fun / chart / DEX / explorer / wallet screenshot
  hasPerson: boolean;  // a real human face / identifiable person is visible
  safe: boolean;       // no sexual, violent, or otherwise disallowed content
  summary: string;
}

const IMAGE_SYSTEM = `You screen one image submitted as "proof" to a pump.fun rug-pull registry.
Acceptable evidence is ONLY a screenshot of: a pump.fun token page, a DEX/trading
terminal, a price or market-cap chart, a block explorer (e.g. Solscan), or a
wallet / transaction view.
Return a single JSON object and nothing else:
{"isEvidence": true|false, "hasPerson": true|false, "safe": true|false, "summary": "one short sentence"}
- isEvidence: true ONLY if it is clearly one of the screenshot types above.
- hasPerson: true if a real human face or identifiable person appears.
- safe: false for any sexual content, nudity, graphic violence/gore, or exploitative content.
Be strict. A photo of a person, a meme with a face, or anything unrelated is NOT evidence.`;

export async function verifyEvidenceImage(dataUrl: string): Promise<ImageCheck> {
  try {
    const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
    if (!m) return { isEvidence: false, hasPerson: false, safe: true, summary: "Unreadable image." };
    const media_type = m[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const data = m[2];
    const msg = await client().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: IMAGE_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type, data } },
            { type: "text", text: "Screen this image. Return only the JSON." },
          ],
        },
      ],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return JSON.parse(text.replace(/```json|```/g, "").trim()) as ImageCheck;
  } catch (err) {
    // Fail closed: if we can't screen it, we don't accept it as evidence.
    console.error("verifyEvidenceImage failed:", err);
    return { isEvidence: false, hasPerson: false, safe: true, summary: "Image check unavailable." };
  }
}
