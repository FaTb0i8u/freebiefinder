"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, ThumbsUp, ThumbsDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFreebieStore } from "@/store/useFreebieStore";
import { useHydration } from "@/hooks/useHydration";
import { SubmissionForm } from "./SubmissionForm";
import type { CommunitySubmissionRow } from "@/db/schema";

type VoteState = Record<string, "worked" | "didnt_work" | null>;

const COVERAGE_LABEL: Record<string, string> = {
  national: "",
  regional: "Select regions",
  local:    "Local only",
};

// ─── Add-my-city inline form ──────────────────────────────────────────────────

function AddCityForm({
  submissionId,
  onAdded,
}: {
  submissionId: string;
  onAdded: (city: string) => void;
}) {
  const [city, setCity]     = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "dupe" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) return;
    setStatus("loading");
    const res = await fetch("/api/city-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, city: trimmed }),
    }).catch(() => null);
    if (!res)             { setStatus("error"); return; }
    if (res.status === 429) { setStatus("dupe"); return; }
    if (!res.ok)          { setStatus("error"); return; }
    const data = await res.json();
    onAdded(data.city as string);
    setStatus("done");
  }

  if (status === "done") {
    return (
      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
        ✓ {city.trim()} added!
      </span>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5">
      <input
        autoFocus
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="e.g. Chicago"
        className="w-28 rounded-lg border border-input bg-background px-2 py-0.5 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50"
      />
      <button type="submit" disabled={status === "loading"}
        className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50">
        {status === "loading" ? "…" : "Add"}
      </button>
      {status === "dupe"  && <span className="text-[10px] text-amber-600">Already reported today</span>}
      {status === "error" && <span className="text-[10px] text-destructive">Error, try again</span>}
    </form>
  );
}

// ─── Single community card ────────────────────────────────────────────────────

function CommunityCard({
  sub,
  myVote,
  onVote,
}: {
  sub:    CommunitySubmissionRow;
  myVote: "worked" | "didnt_work" | null | undefined;
  onVote: (id: string, vote: "worked" | "didnt_work") => void;
}) {
  const [showAddCity, setShowAddCity]   = useState(false);
  const [cities, setCities]             = useState<string[]>(sub.availableCities ?? []);
  const coverageLabel = COVERAGE_LABEL[sub.coverageType ?? "national"];

  function handleCityAdded(city: string) {
    setCities((prev) => prev.includes(city) ? prev : [...prev, city]);
    setShowAddCity(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      {/* Name + coverage */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{sub.businessName}</p>
          <p className="text-xs text-muted-foreground truncate">🎁 {sub.whatYouGet}</p>
        </div>
        {coverageLabel && (
          <span className="shrink-0 inline-flex h-4 items-center rounded-full bg-violet-100 px-1.5 text-[9px] font-semibold text-violet-700 ring-1 ring-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-700">
            {coverageLabel}
          </span>
        )}
      </div>

      {/* City tags */}
      {(cities.length > 0 || sub.coverageType !== "national") && (
        <div className="flex flex-wrap items-center gap-1">
          {cities.map((c) => (
            <span key={c} className="inline-flex items-center gap-0.5 rounded-full bg-sky-50 px-1.5 py-0.5 text-[9px] font-medium text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-800">
              <MapPin className="size-2.5" />{c}
            </span>
          ))}
          {showAddCity ? (
            <AddCityForm
              submissionId={sub.id}
              onAdded={handleCityAdded}
            />
          ) : (
            <button
              onClick={() => setShowAddCity(true)}
              className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-muted-foreground/40 px-1.5 py-0.5 text-[9px] text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Plus className="size-2.5" /> Add my city
            </button>
          )}
        </div>
      )}

      {/* If national and no cities yet — still show add-city prompt */}
      {sub.coverageType === "national" && cities.length === 0 && (
        <div className="flex items-center gap-1">
          {showAddCity ? (
            <AddCityForm
              submissionId={sub.id}
              onAdded={handleCityAdded}
            />
          ) : (
            <button
              onClick={() => setShowAddCity(true)}
              className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-muted-foreground/30 px-1.5 py-0.5 text-[9px] text-muted-foreground hover:border-primary hover:text-primary"
            >
              <MapPin className="size-2.5" /> Add city where you found this
            </button>
          )}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex h-4 items-center rounded-full bg-muted px-1.5 text-[9px] text-muted-foreground ring-1 ring-border capitalize">
          {sub.claimWindow.replace(/-/g, " ")}
        </span>
        <span className="inline-flex h-4 items-center rounded-full bg-muted px-1.5 text-[9px] text-muted-foreground ring-1 ring-border capitalize">
          {sub.claimMethod.replace(/-/g, " ")}
        </span>
      </div>

      {/* Vote + source */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onVote(sub.id, "worked")}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 transition-colors",
            myVote === "worked"
              ? "bg-emerald-100 text-emerald-700 ring-emerald-300"
              : "bg-muted text-muted-foreground ring-border hover:bg-emerald-50 hover:text-emerald-700"
          )}
        >
          <ThumbsUp className="size-2.5" /> Worked · {sub.workedVotes}
        </button>
        <button
          onClick={() => onVote(sub.id, "didnt_work")}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 transition-colors",
            myVote === "didnt_work"
              ? "bg-red-100 text-red-700 ring-red-300"
              : "bg-muted text-muted-foreground ring-border hover:bg-red-50 hover:text-red-700"
          )}
        >
          <ThumbsDown className="size-2.5" /> Didn&apos;t work · {sub.didntWorkVotes}
        </button>
        <a href={sub.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="ml-auto text-[10px] text-primary hover:underline">
          Source ↗
        </a>
      </div>
    </div>
  );
}

// ─── Main CommunitySection ────────────────────────────────────────────────────

export function CommunitySection() {
  const hydrated    = useHydration();
  const userCity    = useFreebieStore((s) => s.userCity);
  const userLat     = useFreebieStore((s) => s.userLat);
  const userLng     = useFreebieStore((s) => s.userLng);
  const userRadius  = useFreebieStore((s) => s.userRadius);
  const hasLocation = hydrated && userLat !== null && userLng !== null;

  const [isOpen, setIsOpen]           = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [submissions, setSubmissions] = useState<CommunitySubmissionRow[]>([]);
  const [votes, setVotes]             = useState<VoteState>({});
  const [loading, setLoading]         = useState(false);
  const [fetched, setFetched]         = useState(false);
  const [fetchedForKey, setFetchedForKey] = useState<string | null>(null);

  // Refetch when location/radius changes — key tracks current fetch params
  const fetchKey = hasLocation ? `${userLat?.toFixed(3)},${userLng?.toFixed(3)},${userRadius}` : "all";

  useEffect(() => {
    if (!isOpen) return;
    if (fetchedForKey === fetchKey) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const url = hasLocation
      ? `/api/submissions/nearby?lat=${userLat}&lng=${userLng}&radius=${userRadius}`
      : "/api/submissions";
    fetch(url)
      .then((r) => r.json())
      .then((data: CommunitySubmissionRow[]) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setFetched(true);
        setFetchedForKey(fetchKey);
      })
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [isOpen, fetchKey, fetchedForKey, hasLocation, userLat, userLng, userRadius]);

  async function handleVote(submissionId: string, vote: "worked" | "didnt_work") {
    const prev = votes[submissionId];
    if (prev === vote) return;
    setVotes((v) => ({ ...v, [submissionId]: vote }));
    setSubmissions((subs) =>
      subs.map((s) => {
        if (s.id !== submissionId) return s;
        const wd  = vote === "worked"     ? 1 : prev === "worked"     ? -1 : 0;
        const dwd = vote === "didnt_work" ? 1 : prev === "didnt_work" ? -1 : 0;
        return { ...s, workedVotes: s.workedVotes + wd, didntWorkVotes: s.didntWorkVotes + dwd };
      })
    );
    await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, vote }),
    }).catch(() => {
      setVotes((v) => ({ ...v, [submissionId]: prev ?? null }));
    });
  }

  // When radius filtering is active, the API already returned the right set.
  // No client-side city splitting needed.

  const totalCount = submissions.length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8">
      {/* Section header */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-dashed border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            Community Tips — Unverified
          </span>
          {totalCount > 0 && fetched && (
            <span className="inline-flex h-5 items-center rounded-full bg-blue-100 px-2 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800">
              {totalCount}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {/* Collapsible body */}
      <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">
              {hasLocation
                ? `Showing tips within ${userRadius} mi of ${userCity ?? "your location"} + all national chains.`
                : "Community-submitted tips, not yet verified. Set your location above to filter by radius!"}
            </p>

            {!showForm && (
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full gap-2">
                <Plus className="size-3.5" /> Add a freebie tip
              </Button>
            )}

            {showForm && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">Submit a Freebie Tip</p>
                <SubmissionForm onClose={() => setShowForm(false)} />
              </div>
            )}

            {loading && <p className="text-center text-xs text-muted-foreground py-4">Loading…</p>}

            {/* Submissions list */}
            {!loading && fetched && (
              submissions.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">
                  {hasLocation
                    ? `No tips within ${userRadius} mi yet. Try a larger radius or add one above!`
                    : "No tips yet — be the first!"}
                </p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <CommunityCard key={sub.id} sub={sub} myVote={votes[sub.id]} onVote={handleVote} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
