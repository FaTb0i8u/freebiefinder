import { NextRequest, NextResponse } from "next/server";

export interface GeocodeResult {
  lat:         number;
  lng:         number;
  displayName: string; // e.g. "Oakland, Alameda County, California, United States"
  shortName:   string; // e.g. "Oakland, CA"
}

/**
 * Server-side geocoding via Nominatim (OpenStreetMap).
 * Server-side avoids CORS issues and keeps Nominatim's User-Agent policy satisfied.
 * Rate limit: Nominatim allows 1 req/sec for light use — fine for our interactive use case.
 *
 * GET /api/geocode?city=Oakland
 */
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim();
  if (!city || city.length < 2) {
    return NextResponse.json({ error: "city param required (min 2 chars)" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        // Nominatim requires a descriptive User-Agent per their usage policy
        "User-Agent": "FreebieFinder/1.0 (birthday-freebie-finder app)",
        "Accept-Language": "en",
      },
      // 5-second timeout — if Nominatim is slow, fail gracefully
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
    }

    const data = await res.json() as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country_code?: string;
      };
    }>;

    if (!data.length) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    const result = data[0];
    const addr   = result.address ?? {};
    const cityName = addr.city ?? addr.town ?? addr.village ?? city;
    const state    = addr.state ?? "";
    const isUS     = addr.country_code === "us";

    const shortName = isUS && state
      ? `${cityName}, ${state.length > 3 ? state.slice(0, 2).toUpperCase() : state}`
      : cityName;

    const payload: GeocodeResult = {
      lat:         parseFloat(result.lat),
      lng:         parseFloat(result.lon),
      displayName: result.display_name,
      shortName,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("Geocoding error:", err);
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
