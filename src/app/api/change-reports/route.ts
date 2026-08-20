import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { changeReports } from "@/db/schema";
import { checkRateLimit } from "@/lib/rateLimit";
import { hashIp, getIpFromRequest } from "@/lib/ipHash";

// ─── GET — public summary OR admin full list ─────────────────────────────────
// Without ?key=  → returns { flaggedIds: string[] } (freebieIds with ≥3 reports)
// With    ?key=  → returns full report rows (admin only)

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  // Admin: full report list
  if (key) {
    if (key !== process.env.ADMIN_SECRET_KEY) {
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
      console.error("GET /api/change-reports (admin) error:", err);
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }
  }

  // Public: return open/escalated reports with enough votes to show to users.
  // Returns the highest-voted open report per freebieId as a summary.
  try {
    const db   = getDb();
    const rows = await db
      .select()
      .from(changeReports)
      .where(
        sql`${changeReports.status} IN ('open', 'escalated')
        AND ${changeReports.freebieId} IS NOT NULL`
      );

    // Group by freebieId, keep the one with most trueVotes
    const byFreebie = new Map<string, typeof rows[0]>();
    for (const row of rows) {
      if (!row.freebieId) continue;
      const existing = byFreebie.get(row.freebieId);
      if (!existing || row.trueVotes > existing.trueVotes) {
        byFreebie.set(row.freebieId, row);
      }
    }

    // Only expose reports that have at least 1 trueVote (filter noise)
    const flaggedReports = Array.from(byFreebie.values())
      .filter((r) => r.trueVotes >= 1)
      .map((r) => ({
        reportId:        r.id,
        freebieId:       r.freebieId,
        description:     r.description,
        proposedChanges: r.proposedChanges ? JSON.parse(r.proposedChanges) : null,
        trueVotes:       r.trueVotes,
        falseVotes:      r.falseVotes,
        status:          r.status,
      }));

    return NextResponse.json({ flaggedReports });
  } catch (err) {
    console.error("GET /api/change-reports (public) error:", err);
    return NextResponse.json({ flaggedReports: [] });
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

    // Store structured proposedChanges as JSON if provided (whitelist enforced on vote/apply)
    const proposedChanges = body.proposedChanges && typeof body.proposedChanges === "object"
      ? JSON.stringify(body.proposedChanges)
      : null;

    const [report] = await db
      .insert(changeReports)
      .values({
        freebieId,
        description:     description.trim(),
        proposedChanges,
        reporterIpHash:  ipHash,
      })
      .returning();

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error("POST /api/change-reports error:", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
