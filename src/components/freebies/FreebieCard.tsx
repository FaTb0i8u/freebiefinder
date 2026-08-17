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
  Flag,
  Share2,
  PartyPopper,
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

function isPurchaseRequired(freebie: Freebie): boolean {
  if (freebie.tags?.includes("no-purchase-required")) return false;
  if (freebie.tags?.includes("purchase-required")) return true;
  return freebie.requirements.some((r) => r.toLowerCase().includes("purchase required"));
}

/** Returns true if this freebie is valid/claimable RIGHT NOW given the user's birthday month. */
function isActiveNow(freebie: Freebie, birthdayMonth: number | null): boolean {
  if (!birthdayMonth) return false;
  const currentMonth = new Date().getMonth() + 1; // 1–12
  if (birthdayMonth !== currentMonth) return false;
  // In birthday month: day-only, week, and month all count as active
  return freebie.claimWindow !== "any-time";
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
      {config.icon} {config.label}
    </span>
  );
}

function googleMapsUrl(businessName: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(businessName + " near me")}`;
}

async function shareOrCopy(freebie: Freebie) {
  const text = `🎂 ${freebie.businessName}: ${freebie.whatYouGet}`;
  const url  = freebie.sourceUrl;
  if (navigator.share) {
    await navigator.share({ title: freebie.businessName, text, url }).catch(() => {});
  } else {
    await navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
  }
}

// ─── Flag-as-changed sub-form ─────────────────────────────────────────────────

function FlagForm({ freebieId, onClose }: { freebieId: string; onClose: () => void }) {
  const [desc, setDesc]     = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error" | "dupe">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (desc.trim().length < 10) return;
    setStatus("loading");
    const res = await fetch("/api/change-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ freebieId, description: desc.trim() }),
    }).catch(() => null);
    if (!res) { setStatus("error"); return; }
    if (res.status === 429) { setStatus("dupe"); return; }
    if (!res.ok)            { setStatus("error"); return; }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        ✓ Thanks — our team will review this report.{" "}
        <button className="underline" onClick={onClose}>Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs font-medium text-foreground">What changed?</p>
      <textarea
        rows={2}
        required
        minLength={10}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="e.g. This freebie now requires a purchase"
        className="w-full resize-none rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
      {status === "dupe"  && <p className="text-[10px] text-amber-600">You already flagged this today.</p>}
      {status === "error" && <p className="text-[10px] text-destructive">Something went wrong. Try again.</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onClose}
          className="text-xs text-muted-foreground hover:underline">Cancel</button>
        <button type="submit" disabled={status === "loading"}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto text-xs")}>
          {status === "loading" ? "Sending…" : "Submit"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FreebieCard({
  freebie,
  isFlagged = false,
}: {
  freebie:   Freebie;
  isFlagged?: boolean;
}) {
  const hydrated = useHydration();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const isChecked      = useFreebieStore(selectIsChecked(freebie.id));
  const isRemoved      = useFreebieStore(selectIsRemoved(freebie.id));
  const birthdayMonth  = useFreebieStore((s) => s.birthdayMonth);
  const toggleChecked  = useFreebieStore((s) => s.toggleChecked);
  const removeFromList = useFreebieStore((s) => s.removeFromList);

  if (hydrated && isRemoved) return null;

  const checked          = hydrated && isChecked;
  const activeNow        = hydrated && isActiveNow(freebie, birthdayMonth);
  const claimWindowStyle = CLAIM_WINDOW_STYLES[freebie.claimWindow];
  const categoryStyle    = CATEGORY_STYLES[freebie.category];
  const showFindNearest  = freebie.claimMethod === "in-store" || freebie.claimMethod === "both";
  const purchaseRequired = isPurchaseRequired(freebie);
  const isCommunityTip   = freebie.source === "community";

  async function handleShare() {
    await shareOrCopy(freebie);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm transition-all duration-200",
        purchaseRequired
          ? "border-l-[3px] border-l-amber-400"
          : "border-l-[3px] border-l-emerald-400",
        activeNow && !checked && "ring-2 ring-pink-400/60 ring-offset-1",
        checked
          ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
          : "border-border hover:shadow-md"
      )}
    >
      {/* ── Single-line collapsed row ─────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-no-expand]")) return;
          setIsExpanded((p) => !p);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsExpanded((p) => !p);
        }}
        className="flex cursor-pointer items-center gap-1.5 px-2.5 py-2 select-none"
      >
        <div data-no-expand className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={checked}
            onCheckedChange={() => toggleChecked(freebie.id)}
            aria-label={`Mark ${freebie.businessName} as claimed`}
          />
        </div>

        <span className={cn("shrink-0 text-xs font-bold leading-none", checked && "text-muted-foreground line-through")}>
          {freebie.businessName}
        </span>

        <span className="shrink-0 text-[10px] text-muted-foreground/30">·</span>

        <span className={cn("min-w-0 flex-1 truncate text-xs text-muted-foreground", checked && "line-through")}>
          {freebie.whatYouGet}
        </span>

        {/* Active now! badge — only shows in birthday month */}
        {activeNow && !checked && (
          <span className="shrink-0 inline-flex h-4 items-center gap-0.5 rounded-full bg-pink-100 px-1.5 text-[9px] font-bold text-pink-700 ring-1 ring-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:ring-pink-800">
            <PartyPopper className="size-2.5" />
            Now!
          </span>
        )}

        {/* Community tip badge */}
        {isCommunityTip && (
          <span className="shrink-0 inline-flex h-4 items-center rounded-full bg-blue-50 px-1.5 text-[9px] font-bold uppercase tracking-wide text-blue-600 ring-1 ring-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-700">
            tip
          </span>
        )}

        {/* Free/purchase indicator */}
        <span className={cn(
          "shrink-0 inline-flex h-4 items-center rounded-full px-1.5 text-[9px] font-bold uppercase tracking-wide ring-1",
          purchaseRequired
            ? "bg-amber-50 text-amber-700 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-700"
            : "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-700"
        )}>
          {purchaseRequired ? "w/purch" : "FREE"}
        </span>

        {/* Claim window */}
        <span className={cn("shrink-0 inline-flex h-4 items-center rounded-full px-1.5 text-[9px] font-semibold ring-1", claimWindowStyle.className)}>
          {claimWindowStyle.label}
        </span>

        <div className="shrink-0 text-muted-foreground/60">
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </div>
      </div>

      {/* ── Expanded panel ────────────────────────────────────────────────── */}
      <div className={cn("grid transition-all duration-300 ease-in-out", isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-border/60 px-3 pb-3 pt-3">

            {/* Possibly-changed banner (2.14) */}
            {isFlagged && (
              <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>Some users have reported this freebie may have changed. Verify before heading out.</span>
              </div>
            )}

            {/* Community tip notice */}
            {isCommunityTip && (
              <div className="flex items-start gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>Community tip — not yet verified by our team. Confirm requirements in the app before heading out.</span>
              </div>
            )}

            {/* Active-now callout */}
            {activeNow && !checked && (
              <div className="flex items-center gap-1.5 rounded-lg bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700 ring-1 ring-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:ring-pink-800">
                <PartyPopper className="size-3.5 shrink-0" />
                It&apos;s your birthday month — this freebie is valid right now!
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ring-1", categoryStyle.className)}>
                {categoryStyle.label}
              </span>
              <ClaimMethodBadge method={freebie.claimMethod} />
              <span className={cn(
                "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ring-1",
                purchaseRequired
                  ? "bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
              )}>
                {purchaseRequired ? "Purchase required" : "No purchase needed"}
              </span>
              {checked && (
                <span className="inline-flex h-5 items-center gap-1 rounded-full bg-emerald-100 px-2 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  ✓ Claimed
                </span>
              )}
            </div>

            {/* Freebie description */}
            <div className="rounded-lg bg-primary/5 px-3 py-2">
              <p className="text-sm font-medium leading-snug text-foreground">🎁 {freebie.whatYouGet}</p>
            </div>

            {/* Claim window notes */}
            {freebie.claimWindowNotes && (
              <p className="text-xs text-muted-foreground">📅 {freebie.claimWindowNotes}</p>
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

            {/* Flag form (2.12) */}
            {showFlagForm && (
              <FlagForm freebieId={freebie.id} onClose={() => setShowFlagForm(false)} />
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {showFindNearest && (
                <a href={googleMapsUrl(freebie.businessName)} target="_blank" rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
                  <MapPin className="size-3.5" /> Find Nearest
                </a>
              )}
              <a href={freebie.sourceUrl} target="_blank" rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
                <ExternalLink className="size-3.5" /> More Info
              </a>

              {/* Share button (3.8) */}
              <button onClick={handleShare}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
                <Share2 className="size-3.5" />
                {copied ? "Copied!" : "Share"}
              </button>

              {/* Flag as changed (2.12) */}
              {!showFlagForm && (
                <button onClick={() => setShowFlagForm(true)}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-muted-foreground hover:text-amber-600")}>
                  <Flag className="size-3.5" /> Flag as changed
                </button>
              )}

              {/* Hide */}
              <button onClick={() => removeFromList(freebie.id)}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto gap-1.5 text-muted-foreground hover:text-destructive")}
                aria-label={`Remove ${freebie.businessName} from list`}>
                <Trash2 className="size-3.5" /> Hide
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
