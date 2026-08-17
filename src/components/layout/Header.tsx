"use client";

import { useFreebieStore, selectCheckedCount, selectRemovedCount } from "@/store/useFreebieStore";
import { useHydration } from "@/hooks/useHydration";
import { ACTIVE_FREEBIES } from "@/data/freebies";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function Header() {
  const hydrated = useHydration();
  const checkedCount = useFreebieStore(selectCheckedCount);
  const removedCount = useFreebieStore(selectRemovedCount);
  const clearAllRemoved = useFreebieStore((s) => s.clearAllRemoved);
  const clearAllChecked = useFreebieStore((s) => s.clearAllChecked);

  const totalFreebies = ACTIVE_FREEBIES.length;
  // Visible = total minus removed ones
  const visibleCount = hydrated ? totalFreebies - removedCount : totalFreebies;
  const claimedCount = hydrated ? checkedCount : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/95 backdrop-blur-sm dark:bg-zinc-950/95">
      {/* Top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600" />

      <div className="mx-auto max-w-2xl px-4 py-3">
        {/* App name + tagline */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <span>🎂</span>
              <span>FreebieFinder</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Birthday freebies, all in one place
            </p>
          </div>

          {/* Progress pill */}
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
              {claimedCount} / {visibleCount} claimed
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
            style={{
              width: visibleCount > 0 ? `${(claimedCount / visibleCount) * 100}%` : "0%",
            }}
          />
        </div>

        {/* Removed items notice */}
        {hydrated && removedCount > 0 && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800">
            <span>{removedCount} freebie{removedCount !== 1 ? "s" : ""} hidden from your list</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={clearAllRemoved}
              className="h-5 gap-1 text-amber-700 hover:text-amber-900 dark:text-amber-300"
            >
              <RotateCcw className="size-3" />
              Restore all
            </Button>
          </div>
        )}

        {/* Claimed items reset */}
        {hydrated && checkedCount > 0 && (
          <div className="mt-1.5 flex justify-end">
            <button
              onClick={clearAllChecked}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Reset claimed
            </button>
          </div>
        )}

        {/* Device-only notice */}
        <p className="mt-1 text-center text-[10px] text-muted-foreground/60">
          Your checklist is saved on this device only
        </p>
      </div>
    </header>
  );
}
