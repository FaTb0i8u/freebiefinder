import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { changeReports, communitySubmissions, CHANGE_REPORT_THRESHOLD } from "@/db/schema";
import type { ChangeProposal } from "@/db/schema";
import { checkRateLimit } from "@/lib/rateLimit";
import { hashIp, getIpFromRequest } from "@/lib/ipHash";

/** Whitelisted fields that may be auto-applied to a community submission row. */
const ALLOWED_FIELDS: (keyof ChangeProposal)[] = [
  "dealCondition",
  "minimumPurchaseAmount",
  "priorPurchasePeriod",
  "whatYouGet",
  "claimWindow",
  "isActive",
];

function sanitizeProposal(raw: unknown): Partial<Record<keyof ChangeProposal, unknown>> {
  if (!raw || typeof raw !== "object") return {};
  const result: Partial<Record<keyof ChangeProposal, unknown>> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in (raw as object)) {
      result[key] = (raw as Record<string, unknown>)[key];
    }
  }
  return result;
}

/**
 * POST /api/change-reports/vote
 * Body: { reportId: string, vote: "true" | "false" }
 *
 * Rate limit: 1 vote per IP per report per 24h.
 *
 * After voting:
 * - If True votes >= THRESHOLD and True >= 3× False:
 *   - Community submission → auto-apply proposedChanges + resolve report
 *   - Curated freebie     → escalate report to admin queue (status = "escalated")
 * - If False votes >= THRESHOLD and False >= 3× True:
 *   - Auto-dismiss the report (status = "dismissed")
 */
export async function POST(req: NextRequest) {
  try {
    const ip     = getIpFromRequest(req);
    const ipHash = hashIp(ip);

    const body = await req.json();
    const { reportId, vote } = body;

    if (!reportId || typeof reportId !== "string") {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }
    if (vote !== "true" && vote !== "false") {
      return NextResponse.json({ error: "vote must be 'true' or 'false'" }, { status: 400 });
    }

    const { success } = await checkRateLimit(`${ipHash}:${reportId}:changevote`, "changevote", 1);
    if (!success) {
      return NextResponse.json(
        { error: "You already voted on this report today." },
        { status: 429 }
      );
    }

    const db = getDb();

    // Increment the appropriate counter
    const updated = await db
      .update(changeReports)
      .set(
        vote === "true"
          ? { trueVotes:  sql`${changeReports.trueVotes}  + 1` }
          : { falseVotes: sql`${changeReports.falseVotes} + 1` }
      )
      .where(eq(changeReports.id, reportId))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = updated[0];
    const { trueVotes, falseVotes, status } = report;

    // Skip further logic if already resolved/dismissed/escalated
    if (status !== "open") {
      return NextResponse.json({ success: true, status });
    }

    // ── Auto-escalate or dismiss ────────────────────────────────────────────

    const totalVotes = trueVotes + falseVotes;

    // Dismiss: False votes dominate
    if (falseVotes >= CHANGE_REPORT_THRESHOLD && falseVotes >= trueVotes * 3) {
      await db
        .update(changeReports)
        .set({ status: "dismissed" })
        .where(eq(changeReports.id, reportId));
      return NextResponse.json({ success: true, status: "dismissed" });
    }

    // Escalate/apply: True votes dominate
    if (trueVotes >= CHANGE_REPORT_THRESHOLD && trueVotes >= falseVotes * 3) {
      const proposedChanges = report.proposedChanges
        ? sanitizeProposal(JSON.parse(report.proposedChanges))
        : null;

      if (report.submissionId && proposedChanges && Object.keys(proposedChanges).length) {
        // ── Community submission: auto-apply whitelisted fields ────────────
        // Build a typed partial of only the columns we allow to be written.
        const patch: {
          dealCondition?: string;
          minimumPurchaseAmount?: number;
          priorPurchasePeriod?: string;
          whatYouGet?: string;
          claimWindow?: string;
          isActive?: boolean;
        } = {};
        if ("dealCondition"         in proposedChanges) patch.dealCondition         = String(proposedChanges.dealCondition);
        if ("minimumPurchaseAmount" in proposedChanges) patch.minimumPurchaseAmount = Number(proposedChanges.minimumPurchaseAmount);
        if ("priorPurchasePeriod"   in proposedChanges) patch.priorPurchasePeriod   = String(proposedChanges.priorPurchasePeriod);
        if ("whatYouGet"            in proposedChanges) patch.whatYouGet            = String(proposedChanges.whatYouGet);
        if ("claimWindow"           in proposedChanges) patch.claimWindow           = String(proposedChanges.claimWindow);
        if ("isActive"              in proposedChanges) patch.isActive              = false; // can only deactivate

        if (Object.keys(patch).length) {
          await db
            .update(communitySubmissions)
            .set(patch)
            .where(eq(communitySubmissions.id, report.submissionId));
        }

        await db
          .update(changeReports)
          .set({ status: "resolved" })
          .where(eq(changeReports.id, reportId));

        return NextResponse.json({ success: true, status: "resolved", applied: proposedChanges });
      } else {
        // ── Curated freebie: escalate to admin queue ────────────────────────
        await db
          .update(changeReports)
          .set({ status: "escalated" })
          .where(eq(changeReports.id, reportId));

        return NextResponse.json({ success: true, status: "escalated", totalVotes });
      }
    }

    return NextResponse.json({ success: true, status: "open", trueVotes, falseVotes });
  } catch (err) {
    console.error("POST /api/change-reports/vote error:", err);
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }
}
