import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { cityReports, communitySubmissions } from "@/db/schema";
import { checkRateLimit } from "@/lib/rateLimit";
import { hashIp, getIpFromRequest } from "@/lib/ipHash";

/** Normalize city name: trim + title-case for consistent storage. */
function normalizeCity(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(req: NextRequest) {
  try {
    const ip     = getIpFromRequest(req);
    const ipHash = hashIp(ip);

    const body = await req.json();
    const { submissionId, city } = body;

    if (!submissionId || typeof submissionId !== "string") {
      return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
    }
    if (!city || typeof city !== "string" || city.trim().length < 2) {
      return NextResponse.json({ error: "city must be at least 2 characters" }, { status: 400 });
    }

    const normalized = normalizeCity(city);

    // Rate limit: 1 city addition per IP per submission per 24h
    const { success } = await checkRateLimit(`${ipHash}:${submissionId}:city`, "city", 1);
    if (!success) {
      return NextResponse.json(
        { error: "You already added a city to this submission today." },
        { status: 429 }
      );
    }

    // Geocode the city for radius-based filtering (fire-and-forget coords)
    let latitude: number | null  = null;
    let longitude: number | null = null;
    try {
      const geocodeUrl = new URL("/api/geocode", req.url);
      geocodeUrl.searchParams.set("city", normalized);
      const geoRes = await fetch(geocodeUrl.toString(), {
        signal: AbortSignal.timeout(5000),
      });
      if (geoRes.ok) {
        const geoData = await geoRes.json() as { lat: number; lng: number };
        latitude  = geoData.lat;
        longitude = geoData.lng;
      }
    } catch {
      // Geocoding failure is non-fatal — city is still saved, just without coords
    }

    const db = getDb();

    // Log the report with coordinates
    await db.insert(cityReports).values({
      submissionId,
      city:           normalized,
      reporterIpHash: ipHash,
      latitude,
      longitude,
    });

    // Auto-add city to submission's available_cities if not already present
    await db
      .update(communitySubmissions)
      .set({
        availableCities: sql`
          CASE
            WHEN ${normalized} = ANY(available_cities) THEN available_cities
            ELSE array_append(available_cities, ${normalized})
          END
        `,
      })
      .where(eq(communitySubmissions.id, submissionId));

    return NextResponse.json({ success: true, city: normalized }, { status: 201 });
  } catch (err) {
    console.error("POST /api/city-reports error:", err);
    return NextResponse.json({ error: "Failed to save city report" }, { status: 500 });
  }
}
