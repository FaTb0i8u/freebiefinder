import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { communitySubmissions } from "@/db/schema";
import { checkRateLimit } from "@/lib/rateLimit";
import { hashIp, getIpFromRequest } from "@/lib/ipHash";

// ─── GET — public: fetch all approved community submissions ──────────────────

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(communitySubmissions)
      .where(eq(communitySubmissions.status, "approved"));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/submissions error:", err);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

// ─── POST — submit a new community freebie ───────────────────────────────────

const REQUIRED_FIELDS = [
  "businessName", "category", "whatYouGet",
  "claimMethod", "claimWindow", "sourceUrl",
] as const;

export async function POST(req: NextRequest) {
  try {
    const ip     = getIpFromRequest(req);
    const ipHash = hashIp(ip);

    // Rate limit: 2 submissions per IP per 24 hours
    const { success } = await checkRateLimit(ipHash, "submit", 2);
    if (!success) {
      return NextResponse.json(
        { error: "Too many submissions from this IP. Try again tomorrow." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
        return NextResponse.json(
          { error: `Missing or invalid field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate sourceUrl
    if (!body.sourceUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "sourceUrl must start with https://" },
        { status: 400 }
      );
    }

    // Validate requirements is an array of strings
    const requirements: string[] = Array.isArray(body.requirements)
      ? body.requirements.filter((r: unknown) => typeof r === "string" && r.trim())
      : [];

    const availableCities: string[] = Array.isArray(body.availableCities)
      ? body.availableCities.filter((c: unknown) => typeof c === "string" && c.trim())
      : [];

    const validCoverageTypes = ["national", "regional", "local"];
    const coverageType = validCoverageTypes.includes(body.coverageType)
      ? body.coverageType
      : "national";

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
        status:                "pending",
        submitterIpHash:       ipHash,
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
    console.error("POST /api/submissions error:", err);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
