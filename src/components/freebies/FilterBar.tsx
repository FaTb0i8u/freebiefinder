"use client";

import { useState } from "react";
import { useFreebieStore } from "@/store/useFreebieStore";
import { useHydration } from "@/hooks/useHydration";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FreebieCategory, ClaimMethod } from "@/types/freebie";
import { Search, MapPin, Globe, Smartphone, LayoutGrid, X, Loader2 } from "lucide-react";
import type { GeocodeResult } from "@/app/api/geocode/route";

const CATEGORIES: Array<{ value: FreebieCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "food-drink", label: "🍕 Food & Drink" },
  { value: "beauty", label: "💄 Beauty" },
  { value: "retail", label: "🛍️ Retail" },
  { value: "entertainment", label: "🎬 Entertainment" },
  { value: "online", label: "🌐 Online" },
];

const CLAIM_METHODS: Array<{
  value: ClaimMethod | "all";
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "all", label: "All", icon: <LayoutGrid className="size-3.5" /> },
  { value: "in-store", label: "In-Store", icon: <MapPin className="size-3.5" /> },
  { value: "app", label: "App", icon: <Smartphone className="size-3.5" /> },
  { value: "online", label: "Online", icon: <Globe className="size-3.5" /> },
];

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

export function FilterBar() {
  const hydrated         = useHydration();
  const filters          = useFreebieStore((s) => s.filters);
  const setFilter        = useFreebieStore((s) => s.setFilter);
  const userCity         = useFreebieStore((s) => s.userCity);
  const userLat          = useFreebieStore((s) => s.userLat);
  const userRadius       = useFreebieStore((s) => s.userRadius);
  const setUserLocation  = useFreebieStore((s) => s.setUserLocation);
  const setUserRadius    = useFreebieStore((s) => s.setUserRadius);
  const clearUserLocation = useFreebieStore((s) => s.clearUserLocation);

  const [cityInput, setCityInput]     = useState("");
  const [geoStatus, setGeoStatus]     = useState<"idle" | "loading" | "error">("idle");

  const hasLocation = hydrated && userLat !== null;

  async function geocodeCity(city: string) {
    if (!city.trim()) return;
    setGeoStatus("loading");
    try {
      const res = await fetch(`/api/geocode?city=${encodeURIComponent(city.trim())}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json() as GeocodeResult;
      setUserLocation(data.lat, data.lng, data.shortName);
      setCityInput("");
      setGeoStatus("idle");
    } catch {
      setGeoStatus("error");
    }
  }

  function useGPS() {
    if (!navigator.geolocation) return;
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse geocode to get a display name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "User-Agent": "FreebieFinder/1.0" } }
          );
          const data = await res.json() as { address?: { city?: string; town?: string; state?: string } };
          const addr = data.address ?? {};
          const name = addr.city ?? addr.town ?? "My location";
          setUserLocation(lat, lng, name);
        } catch {
          setUserLocation(lat, lng, "My location");
        }
        setGeoStatus("idle");
      },
      () => setGeoStatus("error")
    );
  }

  return (
    <div className="sticky top-[88px] z-40 w-full border-b border-border/60 bg-white/95 backdrop-blur-sm dark:bg-zinc-950/95">
      <div className="mx-auto max-w-2xl space-y-2.5 px-4 py-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category pills — horizontal scroll on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter("category", value)}
              className={cn(
                "flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filters.category === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Location + radius — filters community tips ─────────────── */}
        {hasLocation ? (
          /* Active location — show city + radius picker */
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5">
              <MapPin className="size-3.5 shrink-0 text-primary" />
              <span className="flex-1 truncate text-xs font-medium text-foreground">
                📍 {userCity ?? "My location"}
              </span>
              <button onClick={clearUserLocation} aria-label="Clear location"
                className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">Within:</span>
              {RADIUS_OPTIONS.map((r) => (
                <button key={r} onClick={() => setUserRadius(r)}
                  className={cn(
                    "flex-1 rounded-lg border py-1 text-xs font-medium transition-colors",
                    userRadius === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  )}>
                  {r} mi
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* No location set — show GPS button + city text input */
          <div className="flex gap-2">
            <button
              onClick={useGPS}
              disabled={geoStatus === "loading"}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                geoStatus === "error"
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {geoStatus === "loading"
                ? <Loader2 className="size-3.5 animate-spin" />
                : <MapPin className="size-3.5" />
              }
              {geoStatus === "error" ? "Blocked — type city" : "Use my location"}
            </button>
            <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); geocodeCity(cityInput); }}>
              <Input
                placeholder="or type a city..."
                value={cityInput}
                onChange={(e) => { setCityInput(e.target.value); setGeoStatus("idle"); }}
                className="pr-8 text-xs"
              />
              {cityInput && (
                <button type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-primary hover:underline">
                  Go
                </button>
              )}
            </form>
          </div>
        )}

        {/* Claim method chips */}
        <div className="flex gap-1.5">
          {CLAIM_METHODS.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setFilter("claimMethod", value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-colors",
                filters.claimMethod === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
