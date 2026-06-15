// GET /api/admin/pending — the review queue. Admin key required.
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { listPendingRecords } from "@/lib/store";

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const rows = await listPendingRecords();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/admin/pending failed:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
