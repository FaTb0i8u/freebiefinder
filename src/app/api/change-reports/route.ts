import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { changeReports } from "@/db/schema";
import { checkRateLimit } from "@/lib/rateLimit";
import { hashIp, getIpFromRequest } from "@/lib/ipHash";

// ─── GET — admin: fetch open change reports ──────────────────────────────────

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db   = getDb();
    const rows = await db
      .select()
      .from(changeReports)
      .where(eq(changeReports.status, "open"));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/change-reports error:", err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// ─── POST — submit a change report on a curated freebie ──────────────────────

export async function POST(req: NextRequest) {
  try {
    const ip     = getIpFromRequest(req);
    const ipHash = hashIp(ip);

    const body = await req.json();
    const { freebieId, description } = body;

    if (!freebieId || typeof freebieId !== "string") {
      return NextResponse.json({ error: "freebieId is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json(
        { error: "description must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Rate limit: 1 report per IP per freebie per 24h
    const { success } = await checkRateLimit(`${ipHash}:${freebieId}`, "report", 1);
    if (!success) {
      return NextResponse.json(
        { error: "You already reported this freebie today." },
        { status: 429 }
      );
    }

    const db = getDb();
    const [report] = await db
      .insert(changeReports)
      .values({ freebieId, description: description.trim(), reporterIpHash: ipHash })
      .returning();

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error("POST /api/change-reports error:", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
