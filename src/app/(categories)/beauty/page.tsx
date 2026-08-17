import type { Metadata } from "next";
import { CategoryPageClient } from "@/components/freebies/CategoryPageClient";

export const metadata: Metadata = {
  title: "Birthday Beauty Freebies | FreebieFinder",
  description: "Free birthday beauty gifts from Sephora, Ulta, and more. Get free samples, gift sets, and beauty treats on your birthday.",
};

export default function BeautyPage() {
  return <CategoryPageClient category="beauty" />;
}
