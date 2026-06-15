// app/api/records/route.ts — the wall reads from here.
import { NextResponse } from "next/server";
import { listPublicRecords } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await listPublicRecords();
    return NextResponse.json(records);
  } catch (err) {
    console.error("GET /api/records failed:", err);
    return NextResponse.json([], { status: 200 }); // wall keeps its seed on failure
  }
}
