"use client";

import { useState } from "react";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";

const selectClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500";
const inputClass  = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-pink-500";

export function AdminCreateForm({ adminKey }: { adminKey: string }) {
  const [open, setOpen]             = useState(false);
  const [status, setStatus]         = useState<"idle" | "loading" | "success" | "error">("idle");
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [form, setForm] = useState({
    businessName:     "",
    category:         "food-drink",
    whatYouGet:       "",
    claimMethod:      "in-store",
    claimWindow:      "birthday-month",
    claimWindowNotes: "",
    sourceUrl:             "https://",
    coverageType:          "national",
    availableCities:       "",
    claimWindowDaysBefore: "0",
    claimWindowDaysAfter:  "0",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setForm({
      businessName: "", category: "food-drink", whatYouGet: "",
      claimMethod: "in-store", claimWindow: "birthday-month",
      claimWindowNotes: "", sourceUrl: "https://",
      coverageType: "national", availableCities: "",
      claimWindowDaysBefore: "0", claimWindowDaysAfter: "0",
    });
    setRequirements([""]);
    setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const availableCities = form.availableCities
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      ...form,
      requirements:          requirements.filter((r) => r.trim()),
      availableCities,
      claimWindowDaysBefore: form.claimWindow === "birthday-custom" ? parseInt(form.claimWindowDaysBefore) || 0 : null,
      claimWindowDaysAfter:  form.claimWindow === "birthday-custom" ? parseInt(form.claimWindowDaysAfter)  || 0 : null,
    };

    const res = await fetch("/api/admin/submissions", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body:    JSON.stringify(payload),
    }).catch(() => null);

    if (res?.ok) {
      setStatus("success");
      resetForm();
    } else {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-lg bg-zinc-900 ring-1 ring-zinc-800">
      {/* Header — toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="size-4 text-emerald-400" />
          Create Approved Entry
        </span>
        {open ? <ChevronUp className="size-4 text-zinc-400" /> : <ChevronDown className="size-4 text-zinc-400" />}
      </button>

      {/* Body */}
      {open && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-zinc-800 px-4 pb-4 pt-4">
          {status === "success" && (
            <div className="rounded-lg bg-emerald-900/40 px-3 py-2 text-sm text-emerald-400 ring-1 ring-emerald-800">
              ✓ Entry created and live immediately.
            </div>
          )}
          {status === "error" && (
            <div className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-400 ring-1 ring-red-800">
              Something went wrong. Check all required fields.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Business name */}
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-zinc-300">Business Name *</label>
              <input required className={inputClass} placeholder="e.g. Cheesecake Factory"
                value={form.businessName} onChange={(e) => setField("businessName", e.target.value)} />
            </div>

            {/* What you get */}
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-zinc-300">What You Get *</label>
              <input required className={inputClass} placeholder="e.g. Free slice of cheesecake with any purchase"
                value={form.whatYouGet} onChange={(e) => setField("whatYouGet", e.target.value)} />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Category *</label>
              <select className={selectClass} value={form.category} onChange={(e) => setField("category", e.target.value)}>
                <option value="food-drink">Food & Drink</option>
                <option value="beauty">Beauty</option>
                <option value="retail">Retail</option>
                <option value="entertainment">Entertainment</option>
                <option value="online">Online</option>
              </select>
            </div>

            {/* Claim method */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">How to Claim *</label>
              <select className={selectClass} value={form.claimMethod} onChange={(e) => setField("claimMethod", e.target.value)}>
                <option value="in-store">In-Store</option>
                <option value="app">App</option>
                <option value="online">Online</option>
                <option value="both">In-Store & Online</option>
              </select>
            </div>

            {/* Claim window */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Valid During *</label>
              <select className={selectClass} value={form.claimWindow} onChange={(e) => setField("claimWindow", e.target.value)}>
                <option value="birthday-day-only">Birthday day only</option>
                <option value="birthday-week">Birthday week</option>
                <option value="birthday-month">Birthday month</option>
                <option value="birthday-custom">Custom (X days before / Y days after)</option>
                <option value="any-time">Anytime</option>
              </select>
            </div>

            {/* Custom window: days before / after */}
            {form.claimWindow === "birthday-custom" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Days before birthday</label>
                  <input type="number" min="0" max="60" className={inputClass}
                    placeholder="0" value={form.claimWindowDaysBefore}
                    onChange={(e) => setField("claimWindowDaysBefore", e.target.value)} />
                  <p className="text-[10px] text-zinc-500">0 = opens on birthday</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Days after birthday</label>
                  <input type="number" min="0" max="60" className={inputClass}
                    placeholder="0" value={form.claimWindowDaysAfter}
                    onChange={(e) => setField("claimWindowDaysAfter", e.target.value)} />
                  <p className="text-[10px] text-zinc-500">0 = expires on birthday</p>
                </div>
              </>
            )}

            {/* Coverage */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Coverage</label>
              <select className={selectClass} value={form.coverageType} onChange={(e) => setField("coverageType", e.target.value)}>
                <option value="national">National</option>
                <option value="regional">Regional</option>
                <option value="local">Local</option>
              </select>
            </div>

            {/* Notes */}
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-zinc-300">Notes (optional)</label>
              <textarea rows={2}
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                placeholder="e.g. Valid during birthday month with any purchase"
                value={form.claimWindowNotes} onChange={(e) => setField("claimWindowNotes", e.target.value)} />
            </div>

            {/* Requirements */}
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-zinc-300">Requirements</label>
              <div className="space-y-2">
                {requirements.map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <input className={inputClass} placeholder="e.g. Join rewards program"
                      value={req} onChange={(e) => setRequirements((r) => r.map((v, idx) => idx === i ? e.target.value : v))} />
                    {requirements.length > 1 && (
                      <button type="button" onClick={() => setRequirements((r) => r.filter((_, idx) => idx !== i))}
                        className="shrink-0 text-zinc-500 hover:text-white">
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
                {requirements.length < 5 && (
                  <button type="button" onClick={() => setRequirements((r) => [...r, ""])}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                    <Plus className="size-3" /> Add requirement
                  </button>
                )}
              </div>
            </div>

            {/* Cities (for regional/local) */}
            {form.coverageType !== "national" && (
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-zinc-300">Cities (comma-separated)</label>
                <input className={inputClass} placeholder="e.g. Chicago, Austin, Seattle"
                  value={form.availableCities} onChange={(e) => setField("availableCities", e.target.value)} />
              </div>
            )}

            {/* Source URL */}
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-zinc-300">Source URL *</label>
              <input required type="url" className={inputClass} placeholder="https://www.example.com/rewards"
                value={form.sourceUrl} onChange={(e) => setField("sourceUrl", e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={resetForm}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white">
              Clear
            </button>
            <button type="submit" disabled={status === "loading"}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
              {status === "loading" ? "Creating…" : "✓ Create & Approve"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
