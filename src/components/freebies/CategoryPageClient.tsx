"use client";

import { useEffect } from "react";
import { useFreebieStore } from "@/store/useFreebieStore";
import { Header } from "@/components/layout/Header";
import { FilterBar } from "@/components/freebies/FilterBar";
import { FreebieList } from "@/components/freebies/FreebieList";
import { CommunitySection } from "@/components/community/CommunitySection";
import type { FreebieCategory } from "@/types/freebie";

export function CategoryPageClient({ category }: { category: FreebieCategory }) {
  const setFilter = useFreebieStore((s) => s.setFilter);

  // Pre-set the category filter when landing on this page
  useEffect(() => {
    setFilter("category", category);
    return () => setFilter("category", "all"); // reset on unmount
  }, [category, setFilter]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <FilterBar />
      <FreebieList />
      <CommunitySection />
    </div>
  );
}
