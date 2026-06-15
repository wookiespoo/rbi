// POST /api/admin/moderate — approve / flag / reject a claim. Admin key required.
// Body: { id?: number, token?: string, status: "confirmed"|"flagged"|"rejected"|"pending" }
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { setRecordStatus } from "@/lib/store";

const ALLOWED = ["confirmed", "flagged", "rejected", "pending"] as const;

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const status = body.status;
    if (!ALLOWED.includes(status)) {
      return NextResponse.json({ error: "bad status" }, { status: 400 });
    }
    if (body.id == null && !body.token) {
      return NextResponse.json({ error: "id or token required" }, { status: 400 });
    }
    await setRecordStatus({ id: body.id, token: body.token }, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/moderate failed:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
