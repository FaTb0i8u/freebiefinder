"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubmissionForm } from "./SubmissionForm";
import type { CommunitySubmissionRow } from "@/db/schema";

type VoteState = Record<string, "worked" | "didnt_work" | null>;

export function CommunitySection() {
  const [isOpen, setIsOpen]       = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [submissions, setSubmissions] = useState<CommunitySubmissionRow[]>([]);
  const [votes, setVotes]         = useState<VoteState>({});
  const [loading, setLoading]     = useState(false);
  const [fetched, setFetched]     = useState(false);

  // Lazy load — only fetch when the section is first opened
  useEffect(() => {
    if (!isOpen || fetched) return;
    setLoading(true);
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data: CommunitySubmissionRow[]) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setFetched(true);
      })
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [isOpen, fetched]);

  async function handleVote(submissionId: string, vote: "worked" | "didnt_work") {
    // Optimistic update
    const prev = votes[submissionId];
    if (prev === vote) return; // already voted this way

    setVotes((v) => ({ ...v, [submissionId]: vote }));
    setSubmissions((subs) =>
      subs.map((s) => {
        if (s.id !== submissionId) return s;
        const workedDelta     = vote === "worked"      ? 1 : prev === "worked"      ? -1 : 0;
        const didntWorkDelta  = vote === "didnt_work"  ? 1 : prev === "didnt_work"  ? -1 : 0;
        return {
          ...s,
          workedVotes:    s.workedVotes    + workedDelta,
          didntWorkVotes: s.didntWorkVotes + didntWorkDelta,
        };
      })
    );

    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, vote }),
      });
    } catch {
      // Revert optimistic update on failure
      setVotes((v) => ({ ...v, [submissionId]: prev ?? null }));
    }
  }

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
          {submissions.length > 0 && fetched && (
            <span className="inline-flex h-5 items-center rounded-full bg-blue-100 px-2 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800">
              {submissions.length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {/* Collapsible body */}
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}>
        <div className="overflow-hidden">
          <div className="space-y-3 pt-3">
            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground">
              These tips were submitted by users and haven&apos;t been verified by our team. Always confirm in the app before heading out. Vote to help us evaluate them!
            </p>

            {/* Add tip button */}
            {!showForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
                className="w-full gap-2"
              >
                <Plus className="size-3.5" />
                Add a freebie tip
              </Button>
            )}

            {/* Submission form */}
            {showForm && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">Submit a Freebie Tip</p>
                <SubmissionForm onClose={() => setShowForm(false)} />
              </div>
            )}

            {/* Loading */}
            {loading && (
              <p className="text-center text-xs text-muted-foreground py-4">Loading community tips…</p>
            )}

            {/* Submissions list */}
            {!loading && fetched && submissions.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                No community tips yet. Be the first to submit one!
              </p>
            )}

            {!loading && submissions.map((sub) => {
              const myVote = votes[sub.id];
              return (
                <div key={sub.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                  {/* Name + freebie */}
                  <div>
                    <p className="text-xs font-bold text-foreground">{sub.businessName}</p>
                    <p className="text-xs text-muted-foreground">🎁 {sub.whatYouGet}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex h-4 items-center rounded-full bg-muted px-1.5 text-[9px] text-muted-foreground ring-1 ring-border capitalize">
                      {sub.claimWindow.replace(/-/g, " ")}
                    </span>
                    <span className="inline-flex h-4 items-center rounded-full bg-muted px-1.5 text-[9px] text-muted-foreground ring-1 ring-border capitalize">
                      {sub.claimMethod.replace(/-/g, " ")}
                    </span>
                  </div>

                  {/* Vote buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(sub.id, "worked")}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 transition-colors",
                        myVote === "worked"
                          ? "bg-emerald-100 text-emerald-700 ring-emerald-300"
                          : "bg-muted text-muted-foreground ring-border hover:bg-emerald-50 hover:text-emerald-700"
                      )}
                    >
                      <ThumbsUp className="size-2.5" />
                      Worked · {sub.workedVotes}
                    </button>
                    <button
                      onClick={() => handleVote(sub.id, "didnt_work")}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 transition-colors",
                        myVote === "didnt_work"
                          ? "bg-red-100 text-red-700 ring-red-300"
                          : "bg-muted text-muted-foreground ring-border hover:bg-red-50 hover:text-red-700"
                      )}
                    >
                      <ThumbsDown className="size-2.5" />
                      Didn&apos;t work · {sub.didntWorkVotes}
                    </button>
                    <a
                      href={sub.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[10px] text-primary hover:underline"
                    >
                      Source ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
