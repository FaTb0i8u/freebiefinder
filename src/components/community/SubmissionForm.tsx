"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Send } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error" | "ratelimited";

const CATEGORIES = [
  { value: "food-drink",    label: "Food & Drink" },
  { value: "beauty",        label: "Beauty" },
  { value: "retail",        label: "Retail" },
  { value: "entertainment", label: "Entertainment" },
  { value: "online",        label: "Online" },
];

const CLAIM_METHODS = [
  { value: "in-store", label: "In-Store" },
  { value: "app",      label: "App" },
  { value: "online",   label: "Online" },
  { value: "both",     label: "In-Store & Online" },
];

const CLAIM_WINDOWS = [
  { value: "birthday-day-only", label: "Birthday day only" },
  { value: "birthday-week",     label: "Birthday week" },
  { value: "birthday-month",    label: "Birthday month" },
  { value: "any-time",          label: "Anytime" },
];

const selectClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50";

export function SubmissionForm({ onClose }: { onClose?: () => void }) {
  const [status, setStatus]           = useState<Status>("idle");
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [form, setForm] = useState({
    businessName:     "",
    category:         "food-drink",
    whatYouGet:       "",
    claimMethod:      "in-store",
    claimWindow:      "birthday-month",
    claimWindowNotes: "",
    sourceUrl:        "https://",
    coverageType:     "national",
    initialCity:      "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addRequirement() {
    if (requirements.length < 5) setRequirements((r) => [...r, ""]);
  }

  function updateRequirement(i: number, value: string) {
    setRequirements((r) => r.map((v, idx) => (idx === i ? value : v)));
  }

  function removeRequirement(i: number) {
    setRequirements((r) => r.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const payload = {
      ...form,
      requirements: requirements.filter((r) => r.trim()),
      availableCities: form.initialCity.trim() ? [form.initialCity.trim()] : [],
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) { setStatus("ratelimited"); return; }
      if (!res.ok) { setStatus("error"); return; }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="space-y-3 text-center py-4">
        <div className="text-3xl">🎉</div>
        <p className="font-semibold text-foreground">Thanks for the tip!</p>
        <p className="text-sm text-muted-foreground">
          Your submission is under review. If verified, it&apos;ll be added to the main list.
        </p>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Business name */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-foreground">Business Name *</label>
          <Input
            required
            placeholder="e.g. Olive Garden"
            value={form.businessName}
            onChange={(e) => setField("businessName", e.target.value)}
          />
        </div>

        {/* What you get */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-foreground">What You Get *</label>
          <Input
            required
            placeholder="e.g. Free dessert of your choice"
            value={form.whatYouGet}
            onChange={(e) => setField("whatYouGet", e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Category *</label>
          <select
            className={selectClass}
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Claim method */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">How to Claim *</label>
          <select
            className={selectClass}
            value={form.claimMethod}
            onChange={(e) => setField("claimMethod", e.target.value)}
          >
            {CLAIM_METHODS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Claim window */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-foreground">Valid During *</label>
          <select
            className={selectClass}
            value={form.claimWindow}
            onChange={(e) => setField("claimWindow", e.target.value)}
          >
            {CLAIM_WINDOWS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-foreground">Notes (optional)</label>
          <textarea
            rows={2}
            placeholder="e.g. Must show ID, valid with any purchase"
            value={form.claimWindowNotes}
            onChange={(e) => setField("claimWindowNotes", e.target.value)}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        {/* Requirements */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-foreground">Requirements</label>
          <div className="space-y-2">
            {requirements.map((req, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`e.g. Sign up for rewards program`}
                  value={req}
                  onChange={(e) => updateRequirement(i, e.target.value)}
                />
                {requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(i)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
            {requirements.length < 5 && (
              <button
                type="button"
                onClick={addRequirement}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="size-3" /> Add requirement
              </button>
            )}
          </div>
        </div>

        {/* Coverage type */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-foreground">Availability *</label>
          <select
            className={selectClass}
            value={form.coverageType}
            onChange={(e) => setField("coverageType", e.target.value)}
          >
            <option value="national">National — available everywhere</option>
            <option value="regional">Regional — select cities/states only</option>
            <option value="local">Local — one specific location</option>
          </select>
        </div>

        {/* Initial city (for regional/local) */}
        {form.coverageType !== "national" && (
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-foreground">
              {form.coverageType === "local" ? "Location" : "City where you found it"}
            </label>
            <Input
              placeholder={form.coverageType === "local" ? "e.g. Austin, TX" : "e.g. Chicago"}
              value={form.initialCity}
              onChange={(e) => setField("initialCity", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Other users can add more cities later</p>
          </div>
        )}

        {/* Source URL */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-foreground">Source URL *</label>
          <Input
            required
            type="url"
            placeholder="https://www.example.com/rewards"
            value={form.sourceUrl}
            onChange={(e) => setField("sourceUrl", e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">Link to the official rewards/birthday page</p>
        </div>
      </div>

      {/* Error states */}
      {status === "error" && (
        <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
      )}
      {status === "ratelimited" && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          You&apos;ve submitted too many freebies today. Try again tomorrow!
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onClose && (
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={status === "loading"}>
          <Send className="size-3.5" />
          {status === "loading" ? "Submitting…" : "Submit Tip"}
        </Button>
      </div>
    </form>
  );
}
