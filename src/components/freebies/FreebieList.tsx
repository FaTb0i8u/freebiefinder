"use client";

import { useMemo } from "react";
import { ACTIVE_FREEBIES } from "@/data/freebies";
import { useFreebieStore } from "@/store/useFreebieStore";
import { useHydration } from "@/hooks/useHydration";
import { FreebieCard } from "./FreebieCard";
import type { ClaimMethod } from "@/types/freebie";
import { PartyPopper } from "lucide-react";

export function FreebieList() {
  const hydrated = useHydration();
  const filters = useFreebieStore((s) => s.filters);
  const removedIds = useFreebieStore((s) => s.removedIds);

  const filtered = useMemo(() => {
    const searchLower = filters.search.toLowerCase();

    return ACTIVE_FREEBIES.filter((freebie) => {
      // Hide removed items (only after hydration to avoid flicker)
      if (hydrated && removedIds.has(freebie.id)) return false;

      // Search filter
      if (
        searchLower &&
        !freebie.businessName.toLowerCase().includes(searchLower) &&
        !freebie.whatYouGet.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      // Category filter
      if (filters.category !== "all" && freebie.category !== filters.category) {
        return false;
      }

      // Claim method filter
      // "both" entries appear in both in-store and online/app searches
      if (filters.claimMethod !== "all") {
        const m = freebie.claimMethod;
        if (m !== "both" && m !== filters.claimMethod) return false;
        // Special case: "app" filter should only match "app" or "both"
        // "online" filter should match "online" or "both"
        // "in-store" filter should match "in-store" or "both"
      }

      return true;
    });
  }, [filters, hydrated, removedIds]);

  // Empty state — no results for current filters
  if (filtered.length === 0) {
    const isFiltered =
      filters.search !== "" ||
      filters.category !== "all" ||
      filters.claimMethod !== "all";

    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-4 text-5xl">{isFiltered ? "🔍" : "🎉"}</div>
        <h2 className="text-lg font-semibold text-foreground">
          {isFiltered ? "No freebies match your filters" : "No freebies available"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFiltered
            ? "Try adjusting your search or filters."
            : "Check back soon — we're always adding more!"}
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-4">
      {/* Result count */}
      <p className="mb-3 text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> freebie{filtered.length !== 1 ? "s" : ""}
        {filters.category !== "all" && (
          <span> in <span className="font-medium text-foreground capitalize">{filters.category.replace("-", " & ")}</span></span>
        )}
      </p>

      {/* Freebie cards */}
      <div className="space-y-3">
        {filtered.map((freebie) => (
          <FreebieCard key={freebie.id} freebie={freebie} />
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-8 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
        <PartyPopper className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Happy Birthday! 🎂</p>
        <p className="text-xs text-muted-foreground">
          Know a freebie we&apos;re missing?{" "}
          <span className="text-primary">Community additions coming soon.</span>
        </p>
      </div>
    </main>
  );
}
