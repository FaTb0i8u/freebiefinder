import type { Metadata } from "next";
import { CategoryPageClient } from "@/components/freebies/CategoryPageClient";

export const metadata: Metadata = {
  title: "Birthday Food & Drink Freebies | FreebieFinder",
  description: "Free birthday meals, drinks, and treats at top restaurants — IHOP, Starbucks, Denny's, Cheesecake Factory, and more. No sign-up required to browse.",
};

export default function FoodDrinkPage() {
  return <CategoryPageClient category="food-drink" />;
}
