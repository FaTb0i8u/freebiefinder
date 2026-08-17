import type { Metadata } from "next";
import { CategoryPageClient } from "@/components/freebies/CategoryPageClient";

export const metadata: Metadata = {
  title: "Birthday Retail Freebies & Discounts | FreebieFinder",
  description: "Free birthday gifts and discounts from retail stores. Claim free items and special birthday offers from top retailers.",
};

export default function RetailPage() {
  return <CategoryPageClient category="retail" />;
}
