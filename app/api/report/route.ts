// app/api/report/route.ts — the verify gate.
// A community report is checked against on-chain data AND, if a screenshot is
// attached, against Claude's vision screen. It is accepted only if the chain
// backs it or a valid proof screenshot is attached — and even then it lands as
// "pending" (hidden) for manual review, never auto-published. False or
// unverifiable accusations never reach a reviewer or the wall.

import { NextResponse } from "next/server";
import { verifyReport, verifyEvidenceImage } from "@/lib/analyzeDeployer";
import { getWalletEvents } from "@/lib/chain";
import { upsertRecord, uploadEvidence } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = (body.token ?? "").trim();
    const reason = (body.reason ?? "").trim();
    const name = (body.name ?? "").trim() || undefined;
    const deployer = (body.deployer ?? "").trim() || undefined;
    const submitterWallet = (body.submitterWallet ?? "").trim() || undefined;
    const projectX = (body.projectX ?? "").trim() || undefined;
    const image =
      typeof body.image === "string" && body.image.startsWith("data:image/") ? body.image : null;

    if (!token || !reason) {
      return NextResponse.json(
        { accepted: false, message: "Token and description are required." },
        { status: 400 },
      );
    }

    // 1) On-chain check against the deployer wallet (or whatever was submitted).
    const subject = deployer ?? token;
    const events = await getWalletEvents(subject);
    const { supported: chainOk, analysis } = await verifyReport(reason, {
      wallet: subject,
      tokenMint: token,
      tokenName: name,
      events,
    });

    // 2) Screenshot check (optional). A submitted image MUST be a real token
    //    page / chart screenshot, show no person's face, and be safe — or the
    //    whole submission is refused before anything is stored.
    let imageUrl: string | null = null;
    if (image) {
      const check = await verifyEvidenceImage(image);
      if (!check.isEvidence || check.hasPerson || !check.safe) {
        return NextResponse.json({
          accepted: false,
          message: check.hasPerson
            ? "That image shows a person — only token-page or chart screenshots are allowed."
            : "That image isn't a valid pump.fun / chart screenshot, so it wasn't added.",
        });
      }
      imageUrl = await uploadEvidence(image);
    }

    // 3) Accept only if the chain backs it OR a verified screenshot is attached.
    if (!chainOk && !imageUrl) {
      await upsertRecord({ token, deployer, name, reason, source: "community", status: "rejected" });
      return NextResponse.json({
        accepted: false,
        message: "Couldn't verify this against on-chain data or a valid screenshot, so it wasn't added.",
      });
    }

    await upsertRecord({
      token,
      deployer,
      name,
      reason,
      source: "community",
      status: "pending", // hidden until a human approves it in Supabase
      submitterWallet,
      projectX,
      imageUrl,
      tags: chainOk ? analysis.tags : [],
      solStolen: chainOk ? analysis.solExtracted : null,
      confidence: chainOk ? analysis.confidence : null,
      evidenceTxs: chainOk ? analysis.evidenceTxs : [],
    });

    return NextResponse.json({
      accepted: true,
      message: chainOk
        ? "Verified on-chain — sent to the review queue."
        : "Proof screenshot accepted — sent to the review queue.",
    });
  } catch (err) {
    console.error("POST /api/report failed:", err);
    return NextResponse.json(
      { accepted: false, message: "Submission failed — try again." },
      { status: 500 },
    );
  }
}
