"use client";

import { useFreebieStore, selectCheckedCount, selectRemovedCount } from "@/store/useFreebieStore";
import { useHydration } from "@/hooks/useHydration";
import { ACTIVE_FREEBIES } from "@/data/freebies";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CURRENT_MONTH = new Date().getMonth() + 1; // 1–12

export function Header() {
  const hydrated       = useHydration();
  const checkedCount   = useFreebieStore(selectCheckedCount);
  const removedCount   = useFreebieStore(selectRemovedCount);
  const birthdayMonth  = useFreebieStore((s) => s.birthdayMonth);
  const clearAllRemoved  = useFreebieStore((s) => s.clearAllRemoved);
  const clearAllChecked  = useFreebieStore((s) => s.clearAllChecked);
  const setBirthdayMonth = useFreebieStore((s) => s.setBirthdayMonth);

  const totalFreebies = ACTIVE_FREEBIES.length;
  const visibleCount  = hydrated ? totalFreebies - removedCount : totalFreebies;
  const claimedCount  = hydrated ? checkedCount : 0;
  const isBirthdayMonth = hydrated && birthdayMonth === CURRENT_MONTH;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/95 backdrop-blur-sm dark:bg-zinc-950/95">
      <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600" />

      <div className="mx-auto max-w-2xl px-4 py-3">
        {/* Birthday Mode active banner */}
        {isBirthdayMonth && (
          <div className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-50 to-violet-50 px-3 py-1.5 text-xs font-semibold text-pink-700 ring-1 ring-pink-200 dark:from-pink-950/30 dark:to-violet-950/30 dark:text-pink-300 dark:ring-pink-800">
            🎂 Birthday Month active! Freebies marked <span className="rounded-full bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-pink-300">Now!</span> are valid this month
          </div>
        )}

        {/* App name + progress */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <span>🎂</span>
              <span>FreebieFinder</span>
            </h1>
            <p className="text-xs text-muted-foreground">Birthday freebies, all in one place</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
            {claimedCount} / {visibleCount} claimed
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
            style={{ width: visibleCount > 0 ? `${(claimedCount / visibleCount) * 100}%` : "0%" }}
          />
        </div>

        {/* Birthday Mode selector (3.4) */}
        <div className="mt-2.5 flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">🎂 My birthday:</label>
          <select
            value={birthdayMonth ?? ""}
            onChange={(e) => setBirthdayMonth(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="">Not set</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          {birthdayMonth && (
            <button
              onClick={() => setBirthdayMonth(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
              aria-label="Clear birthday month"
            >
              ✕
            </button>
          )}
        </div>

        {/* Removed items notice */}
        {hydrated && removedCount > 0 && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800">
            <span>{removedCount} freebie{removedCount !== 1 ? "s" : ""} hidden from your list</span>
            <Button variant="ghost" size="xs" onClick={clearAllRemoved}
              className="h-5 gap-1 text-amber-700 hover:text-amber-900 dark:text-amber-300">
              <RotateCcw className="size-3" /> Restore all
            </Button>
          </div>
        )}

        {hydrated && checkedCount > 0 && (
          <div className="mt-1.5 flex justify-end">
            <button onClick={clearAllChecked}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              Reset claimed
            </button>
          </div>
        )}

        <p className="mt-1 text-center text-[10px] text-muted-foreground/60">
          Your checklist is saved on this device only
        </p>
      </div>
    </header>
  );
}
