import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { communitySubmissions, cityReports } from "@/db/schema";

/**
 * GET /api/submissions/nearby?lat=37.8&lng=-122.3&radius=25
 *
 * Returns approved community submissions within `radius` miles of (lat, lng).
 * National-coverage submissions are always included.
 * Regional/local submissions are included if they have a geocoded city within radius.
 *
 * Uses the Haversine formula in PostgreSQL — no external dependencies.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const lat    = parseFloat(params.get("lat") ?? "");
  const lng    = parseFloat(params.get("lng") ?? "");
  const radius = parseFloat(params.get("radius") ?? "25");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required numbers" }, { status: 400 });
  }
  if (radius < 1 || radius > 500) {
    return NextResponse.json({ error: "radius must be between 1 and 500 miles" }, { status: 400 });
  }

  try {
    const db = getDb();

    // Haversine distance in miles using PostgreSQL:
    // 3959 = Earth's radius in miles
    const haversine = sql<number>`
      (3959 * acos(
        LEAST(1.0,
          cos(radians(${lat})) * cos(radians(${cityReports.latitude})) *
          cos(radians(${cityReports.longitude}) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(${cityReports.latitude}))
        )
      ))
    `;

    // Get IDs of regional/local submissions with a city within radius
    const nearbyIds = await db
      .selectDistinct({ id: cityReports.submissionId })
      .from(cityReports)
      .where(sql`
        ${cityReports.latitude} IS NOT NULL
        AND ${cityReports.longitude} IS NOT NULL
        AND ${haversine} <= ${radius}
      `);

    const nearbyIdSet = new Set(nearbyIds.map((r) => r.id));

    // Fetch all approved submissions
    const allApproved = await db
      .select()
      .from(communitySubmissions)
      .where(eq(communitySubmissions.status, "approved"));

    // Filter: include national ones always, include regional/local only if nearby
    const results = allApproved.filter(
      (s) => s.coverageType === "national" || nearbyIdSet.has(s.id)
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error("GET /api/submissions/nearby error:", err);
    return NextResponse.json({ error: "Failed to fetch nearby submissions" }, { status: 500 });
  }
}
