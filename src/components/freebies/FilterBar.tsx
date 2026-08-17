"use client";

import { useFreebieStore } from "@/store/useFreebieStore";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FreebieCategory, ClaimMethod } from "@/types/freebie";
import { Search, MapPin, Globe, Smartphone, LayoutGrid } from "lucide-react";

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

export function FilterBar() {
  const filters = useFreebieStore((s) => s.filters);
  const setFilter = useFreebieStore((s) => s.setFilter);

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
