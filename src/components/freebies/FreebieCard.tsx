"use client";

import { useState } from "react";
import type { Freebie } from "@/types/freebie";
import { useFreebieStore, selectIsChecked, selectIsRemoved } from "@/store/useFreebieStore";
import { useHydration } from "@/hooks/useHydration";
import { Checkbox } from "@/components/ui/checkbox";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Globe,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<Freebie["category"], { label: string; className: string }> = {
  "food-drink":  { label: "Food & Drink",  className: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800" },
  beauty:        { label: "Beauty",        className: "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800" },
  retail:        { label: "Retail",        className: "bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800" },
  entertainment: { label: "Entertainment", className: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800" },
  online:        { label: "Online",        className: "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800" },
};

const CLAIM_WINDOW_STYLES: Record<Freebie["claimWindow"], { label: string; className: string }> = {
  "birthday-day-only": { label: "Day Only", className: "bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800" },
  "birthday-week":     { label: "Week",     className: "bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800" },
  "birthday-month":    { label: "Month",    className: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800" },
  "any-time":          { label: "Anytime",  className: "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800" },
};

/** Derives whether this freebie requires a purchase from tags/requirements. */
function isPurchaseRequired(freebie: Freebie): boolean {
  if (freebie.tags?.includes("no-purchase-required")) return false;
  if (freebie.tags?.includes("purchase-required")) return true;
  return freebie.requirements.some((r) =>
    r.toLowerCase().includes("purchase required")
  );
}

function ClaimMethodBadge({ method }: { method: Freebie["claimMethod"] }) {
  if (method === "both") {
    return (
      <div className="flex gap-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
          <MapPin className="size-3" /> In-Store
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
          <Globe className="size-3" /> Online
        </span>
      </div>
    );
  }

  const config = {
    "in-store": { icon: <MapPin className="size-3" />,     label: "In-Store" },
    online:     { icon: <Globe className="size-3" />,      label: "Online" },
    app:        { icon: <Smartphone className="size-3" />, label: "App Only" },
  }[method];

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
      {config.icon}
      {config.label}
    </span>
  );
}

function googleMapsUrl(businessName: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(businessName + " near me")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FreebieCard({ freebie }: { freebie: Freebie }) {
  const hydrated = useHydration();
  const [isExpanded, setIsExpanded] = useState(false);

  const isChecked      = useFreebieStore(selectIsChecked(freebie.id));
  const isRemoved      = useFreebieStore(selectIsRemoved(freebie.id));
  const toggleChecked  = useFreebieStore((s) => s.toggleChecked);
  const removeFromList = useFreebieStore((s) => s.removeFromList);

  if (hydrated && isRemoved) return null;

  const checked          = hydrated && isChecked;
  const claimWindowStyle = CLAIM_WINDOW_STYLES[freebie.claimWindow];
  const categoryStyle    = CATEGORY_STYLES[freebie.category];
  const showFindNearest  = freebie.claimMethod === "in-store" || freebie.claimMethod === "both";
  const purchaseRequired = isPurchaseRequired(freebie);
  const isCommunityTip   = freebie.source === "community";

  return (
    <div
      className={cn(
        // Base card — left border accent is the free/purchase indicator
        "rounded-xl border bg-card shadow-sm transition-all duration-200",
        // Left border: thick colored stripe (free = green, purchase = amber)
        purchaseRequired
          ? "border-l-[3px] border-l-amber-400"
          : "border-l-[3px] border-l-emerald-400",
        // Checked state overrides
        checked
          ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
          : "border-border hover:shadow-md"
      )}
    >
      {/* ── Compact single-line summary row ───────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-no-expand]")) return;
          setIsExpanded((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsExpanded((prev) => !prev);
        }}
        className="flex cursor-pointer items-center gap-1.5 px-2.5 py-2 select-none"
      >
        {/* Checkbox */}
        <div data-no-expand className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={checked}
            onCheckedChange={() => toggleChecked(freebie.id)}
            aria-label={`Mark ${freebie.businessName} as claimed`}
          />
        </div>

        {/* Business name */}
        <span className={cn(
          "shrink-0 text-xs font-bold leading-none",
          checked && "text-muted-foreground line-through"
        )}>
          {freebie.businessName}
        </span>

        {/* Divider */}
        <span className="shrink-0 text-[10px] text-muted-foreground/30">·</span>

        {/* Freebie description — fills remaining space, truncates */}
        <span className={cn(
          "min-w-0 flex-1 truncate text-xs text-muted-foreground",
          checked && "line-through"
        )}>
          {freebie.whatYouGet}
        </span>

        {/* Free / purchase badge */}
        <span className={cn(
          "shrink-0 inline-flex h-4 items-center rounded-full px-1.5 text-[9px] font-bold uppercase tracking-wide ring-1",
          purchaseRequired
            ? "bg-amber-50 text-amber-700 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-700"
            : "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-700"
        )}>
          {purchaseRequired ? "w/purch" : "FREE"}
        </span>

        {/* Claim window badge */}
        <span className={cn(
          "shrink-0 inline-flex h-4 items-center rounded-full px-1.5 text-[9px] font-semibold ring-1",
          claimWindowStyle.className
        )}>
          {claimWindowStyle.label}
        </span>

        {/* Community tip badge */}
        {isCommunityTip && (
          <span className="shrink-0 inline-flex h-4 items-center rounded-full bg-blue-50 px-1.5 text-[9px] font-bold uppercase tracking-wide text-blue-600 ring-1 ring-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-700">
            tip
          </span>
        )}

        {/* Expand chevron */}
        <div className="shrink-0 text-muted-foreground/60">
          {isExpanded
            ? <ChevronUp className="size-3.5" />
            : <ChevronDown className="size-3.5" />
          }
        </div>
      </div>

      {/* ── Expanded detail panel (animated) ──────────────────────────────── */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-border/60 px-3 pb-3 pt-3">

            {/* Category + claim method + free status badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn(
                "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ring-1",
                categoryStyle.className
              )}>
                {categoryStyle.label}
              </span>
              <ClaimMethodBadge method={freebie.claimMethod} />
              <span className={cn(
                "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ring-1",
                purchaseRequired
                  ? "bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-700"
                  : "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-700"
              )}>
                {purchaseRequired ? "Purchase required" : "No purchase needed"}
              </span>
              {checked && (
                <span className="inline-flex h-5 items-center gap-1 rounded-full bg-emerald-100 px-2 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
                  ✓ Claimed
                </span>
              )}
            </div>

            {/* Community tip notice */}
            {isCommunityTip && (
              <div className="flex items-start gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>Community tip — not yet verified by our team. Confirm requirements in the app before heading out.</span>
              </div>
            )}

            {/* Full freebie description */}
            <div className="rounded-lg bg-primary/5 px-3 py-2">
              <p className="text-sm font-medium leading-snug text-foreground">
                🎁 {freebie.whatYouGet}
              </p>
            </div>

            {/* Claim window notes */}
            {freebie.claimWindowNotes && (
              <p className="text-xs text-muted-foreground">
                📅 {freebie.claimWindowNotes}
              </p>
            )}

            {/* Requirements */}
            {freebie.requirements.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Requirements</p>
                <ul className="space-y-0.5">
                  {freebie.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="mt-0.5 shrink-0">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Registration deadline */}
            {freebie.registrationDeadline && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>Register by: <strong>{freebie.registrationDeadline}</strong></span>
              </div>
            )}

            {/* Action buttons + remove */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {showFindNearest && (
                <a
                  href={googleMapsUrl(freebie.businessName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                >
                  <MapPin className="size-3.5" />
                  Find Nearest
                </a>
              )}
              <a
                href={freebie.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
              >
                <ExternalLink className="size-3.5" />
                More Info
              </a>
              <button
                onClick={() => removeFromList(freebie.id)}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "ml-auto gap-1.5 text-muted-foreground hover:text-destructive"
                )}
                aria-label={`Remove ${freebie.businessName} from list`}
              >
                <Trash2 className="size-3.5" />
                Hide
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
