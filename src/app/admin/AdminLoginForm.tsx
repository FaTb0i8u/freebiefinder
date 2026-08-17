"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm({ error }: { error?: boolean }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const key = inputRef.current?.value.trim();
    if (!key) return;
    setLoading(true);
    // Navigate to the same page with the key as a query param.
    // The server component will validate it.
    router.push(`/admin?key=${encodeURIComponent(key)}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-3xl">🎂</p>
          <h1 className="mt-2 text-xl font-bold text-white">FreebieFinder Admin</h1>
          <p className="mt-1 text-sm text-zinc-400">Enter your admin password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            required
            placeholder="Admin password"
            autoFocus
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />

          {error && (
            <p className="text-center text-sm text-red-400">
              Incorrect password. Try again.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-500 disabled:opacity-60"
          >
            {loading ? "Checking…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
