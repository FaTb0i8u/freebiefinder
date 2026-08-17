"use client";

import { useState, useEffect } from "react";

/**
 * Returns true once the component has mounted on the client.
 * Use this to avoid localStorage/Zustand hydration mismatches between
 * the server render (empty state) and client render (populated state).
 */
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
