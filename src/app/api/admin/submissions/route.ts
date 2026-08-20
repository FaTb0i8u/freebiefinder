import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { communitySubmissions } from "@/db/schema";

const REQUIRED = ["businessName", "category", "whatYouGet", "claimMethod", "claimWindow", "sourceUrl"] as const;

/**
 * POST /api/admin/submissions
 * Admin-only: create a community submission that is instantly approved.
 * Requires header: x-admin-key: YOUR_ADMIN_SECRET_KEY
 */
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    for (const field of REQUIRED) {
      if (!body[field]?.trim()) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    if (!body.sourceUrl.startsWith("https://")) {
      return NextResponse.json({ error: "sourceUrl must start with https://" }, { status: 400 });
    }

    const requirements: string[]    = Array.isArray(body.requirements)
      ? body.requirements.filter((r: unknown) => typeof r === "string" && (r as string).trim())
      : [];
    const availableCities: string[] = Array.isArray(body.availableCities)
      ? body.availableCities.filter((c: unknown) => typeof c === "string" && (c as string).trim())
      : [];
    const validCoverage = ["national", "regional", "local"];
    const coverageType  = validCoverage.includes(body.coverageType) ? body.coverageType : "national";

    const db = getDb();
    const [submission] = await db
      .insert(communitySubmissions)
      .values({
        businessName:     body.businessName.trim(),
        category:         body.category,
        whatYouGet:       body.whatYouGet.trim(),
        claimMethod:      body.claimMethod,
        requirements,
        claimWindow:      body.claimWindow,
        claimWindowNotes: body.claimWindowNotes?.trim() || null,
        sourceUrl:        body.sourceUrl.trim(),
        status:                "approved", // ← instantly live
        coverageType,
        availableCities,
        claimWindowDaysBefore: body.claimWindow === "birthday-custom" ? (parseInt(body.claimWindowDaysBefore) || 0) : null,
        claimWindowDaysAfter:  body.claimWindow === "birthday-custom" ? (parseInt(body.claimWindowDaysAfter)  || 0) : null,
        dealCondition:         ["none","any-purchase","min-purchase","prior-purchase"].includes(body.dealCondition) ? body.dealCondition : "none",
        minimumPurchaseAmount: body.dealCondition === "min-purchase" ? (parseInt(body.minimumPurchaseAmount) || null) : null,
        priorPurchasePeriod:   body.dealCondition === "prior-purchase" ? (body.priorPurchasePeriod?.trim() || null) : null,
      })
      .returning();

    return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/submissions error:", err);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
