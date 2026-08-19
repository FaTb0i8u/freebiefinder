"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FreebieFilters } from "@/types/freebie";

interface FreebieStore {
  // ─── Persisted (localStorage) ────────────────────────────────────────────
  checkedIds:    Set<string>;
  removedIds:    Set<string>;
  /** 1–12 (January=1). null means Birthday Mode is off. */
  birthdayMonth: number | null;
  /** Display label for the user's chosen location (persisted). */
  userCity:   string | null;
  /** Radius in miles for nearby filtering (persisted). */
  userRadius: number;
  /** Lat/lng from GPS or geocoding — session only, not persisted. */
  userLat:    number | null;
  userLng:    number | null;

  // ─── Session (not persisted) ─────────────────────────────────────────────
  filters: FreebieFilters;

  // ─── Actions ─────────────────────────────────────────────────────────────
  toggleChecked:    (id: string) => void;
  removeFromList:   (id: string) => void;
  restoreToList:    (id: string) => void;
  clearAllRemoved:  () => void;
  clearAllChecked:  () => void;
  setFilter:        <K extends keyof FreebieFilters>(key: K, value: FreebieFilters[K]) => void;
  resetFilters:     () => void;
  setBirthdayMonth: (month: number | null) => void;
  setUserCity:      (city: string | null) => void;
  setUserRadius:    (radius: number) => void;
  setUserLocation:  (lat: number, lng: number, city: string) => void;
  clearUserLocation: () => void;
}

const DEFAULT_FILTERS: FreebieFilters = {
  search:      "",
  category:    "all",
  claimMethod: "all",
};

export const useFreebieStore = create<FreebieStore>()(
  persist(
    (set) => ({
      checkedIds:    new Set<string>(),
      removedIds:    new Set<string>(),
      birthdayMonth: null,
      userCity:      null,
      userRadius:    25,
      userLat:       null,
      userLng:       null,
      filters:       DEFAULT_FILTERS,

      toggleChecked: (id) =>
        set((state) => {
          const next = new Set(state.checkedIds);
          if (next.has(id)) { next.delete(id); } else { next.add(id); }
          return { checkedIds: next };
        }),

      removeFromList: (id) =>
        set((state) => {
          const nextRemoved = new Set(state.removedIds);
          const nextChecked = new Set(state.checkedIds);
          nextRemoved.add(id);
          nextChecked.delete(id);
          return { removedIds: nextRemoved, checkedIds: nextChecked };
        }),

      restoreToList: (id) =>
        set((state) => {
          const next = new Set(state.removedIds);
          next.delete(id);
          return { removedIds: next };
        }),

      clearAllRemoved:   () => set({ removedIds: new Set<string>() }),
      clearAllChecked:   () => set({ checkedIds: new Set<string>() }),
      setBirthdayMonth:  (month)  => set({ birthdayMonth: month }),
      setUserCity:       (city)   => set({ userCity: city ? city.trim() : null }),
      setUserRadius:     (radius) => set({ userRadius: radius }),
      setUserLocation:   (lat, lng, city) => set({ userLat: lat, userLng: lng, userCity: city }),
      clearUserLocation: () => set({ userLat: null, userLng: null, userCity: null }),

      setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    {
      name: "freebie-finder-user-state",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              checkedIds: new Set(parsed.state.checkedIds ?? []),
              removedIds: new Set(parsed.state.removedIds ?? []),
              // birthdayMonth persists as-is (number | null)
            },
          };
        },
        setItem: (name, value) => {
          const serialized = {
            ...value,
            state: {
              ...value.state,
              checkedIds: Array.from(value.state.checkedIds),
              removedIds: Array.from(value.state.removedIds),
              filters: DEFAULT_FILTERS, // session-only
              userLat: null,            // session-only — don't persist GPS coords
              userLng: null,            // session-only
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectIsChecked    = (id: string) => (s: FreebieStore) => s.checkedIds.has(id);
export const selectIsRemoved    = (id: string) => (s: FreebieStore) => s.removedIds.has(id);
export const selectCheckedCount = (s: FreebieStore) => s.checkedIds.size;
export const selectRemovedCount = (s: FreebieStore) => s.removedIds.size;
