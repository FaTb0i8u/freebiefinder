"use client";

import { useMemo, useEffect, useState } from "react";
import { ACTIVE_FREEBIES } from "@/data/freebies";
import { useFreebieStore } from "@/store/useFreebieStore";
import { useHydration } from "@/hooks/useHydration";
import { FreebieCard } from "./FreebieCard";
import { PartyPopper } from "lucide-react";

export function FreebieList() {
  const hydrated   = useHydration();
  const filters    = useFreebieStore((s) => s.filters);
  const removedIds = useFreebieStore((s) => s.removedIds);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Fetch which freebieIds have enough change reports to be flagged
  useEffect(() => {
    fetch("/api/change-reports")
      .then((r) => r.json())
      .then((data: { flaggedIds?: string[] }) => {
        if (Array.isArray(data.flaggedIds)) {
          setFlaggedIds(new Set(data.flaggedIds));
        }
      })
      .catch(() => {}); // fail silently — don't block the page
  }, []);

  const filtered = useMemo(() => {
    const searchLower = filters.search.toLowerCase();
    return ACTIVE_FREEBIES.filter((freebie) => {
      if (hydrated && removedIds.has(freebie.id)) return false;
      if (searchLower &&
        !freebie.businessName.toLowerCase().includes(searchLower) &&
        !freebie.whatYouGet.toLowerCase().includes(searchLower)) return false;
      if (filters.category !== "all" && freebie.category !== filters.category) return false;
      if (filters.claimMethod !== "all") {
        const m = freebie.claimMethod;
        if (m !== "both" && m !== filters.claimMethod) return false;
      }
      return true;
    });
  }, [filters, hydrated, removedIds]);

  if (filtered.length === 0) {
    const isFiltered = filters.search !== "" || filters.category !== "all" || filters.claimMethod !== "all";
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-4 text-5xl">{isFiltered ? "🔍" : "🎉"}</div>
        <h2 className="text-lg font-semibold text-foreground">
          {isFiltered ? "No freebies match your filters" : "No freebies available"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFiltered ? "Try adjusting your search or filters." : "Check back soon!"}
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-4">
      <p className="mb-3 text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> freebie{filtered.length !== 1 ? "s" : ""}
        {filters.category !== "all" && (
          <span> in <span className="font-medium text-foreground capitalize">{filters.category.replace("-", " & ")}</span></span>
        )}
      </p>
      <div className="space-y-2">
        {filtered.map((freebie) => (
          <FreebieCard
            key={freebie.id}
            freebie={freebie}
            isFlagged={flaggedIds.has(freebie.id)}
          />
        ))}
      </div>
      <div className="mt-8 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
        <PartyPopper className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Happy Birthday! 🎂</p>
        <p className="text-xs text-muted-foreground">
          Know a freebie we&apos;re missing?{" "}
          <span className="text-primary">Use the Community Tips section below.</span>
        </p>
      </div>
    </main>
  );
}
