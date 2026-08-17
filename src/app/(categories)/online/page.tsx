import type { Metadata } from "next";
import { CategoryPageClient } from "@/components/freebies/CategoryPageClient";

export const metadata: Metadata = {
  title: "Birthday Online Freebies & Digital Gifts | FreebieFinder",
  description: "Free birthday rewards you can claim online or through apps — no need to leave home.",
};

export default function OnlinePage() {
  return <CategoryPageClient category="online" />;
}
