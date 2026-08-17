import type { Metadata } from "next";
import { CategoryPageClient } from "@/components/freebies/CategoryPageClient";

export const metadata: Metadata = {
  title: "Birthday Entertainment Freebies | FreebieFinder",
  description: "Free birthday perks at movie theaters, bowling alleys, arcades, and more entertainment venues.",
};

export default function EntertainmentPage() {
  return <CategoryPageClient category="entertainment" />;
}
