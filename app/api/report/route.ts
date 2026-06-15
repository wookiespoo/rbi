// app/api/report/route.ts — the verify gate.
// A community report is checked against on-chain data. Only chain-backed
// reports reach the review queue (status "pending"); the rest are rejected,
// so false accusations never sit in front of a reviewer or hit the wall.

import { NextResponse } from "next/server";
import { verifyReport } from "@/lib/analyzeDeployer";
import { getWalletEvents } from "@/lib/chain";
import { upsertRecord } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = (body.token ?? "").trim();
    const reason = (body.reason ?? "").trim();
    const name = (body.name ?? "").trim() || undefined;
    const deployer = (body.deployer ?? "").trim() || undefined;

    if (!token || !reason) {
      return NextResponse.json({ accepted: false, message: "Token and description are required." }, { status: 400 });
    }

    // Verify against the deployer wallet if given, else whatever was submitted.
    const subject = deployer ?? token;
    const events = await getWalletEvents(subject);
    const { supported, reason: why, analysis } = await verifyReport(reason, {
      wallet: subject,
      tokenMint: token,
      tokenName: name,
      events,
    });

    if (!supported) {
      // Not chain-backed — log as rejected, never enters the public queue.
      await upsertRecord({ token, deployer, name, reason, source: "community", status: "rejected" });
      return NextResponse.json({ accepted: false, message: "Couldn't verify this against on-chain data, so it wasn't added." });
    }

    // Chain-backed — enters the review queue with the evidence attached.
    await upsertRecord({
      token,
      deployer,
      name,
      reason,
      source: "community",
      status: "pending",
      tags: analysis.tags,
      solStolen: analysis.solExtracted,
      confidence: analysis.confidence,
      evidenceTxs: analysis.evidenceTxs,
    });
    return NextResponse.json({ accepted: true, message: "Chain-backed — sent to the review queue." });
  } catch (err) {
    console.error("POST /api/report failed:", err);
    return NextResponse.json({ accepted: false, message: "Submission failed — try again." }, { status: 500 });
  }
}
