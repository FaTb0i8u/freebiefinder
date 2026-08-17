"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { communitySubmissions, changeReports } from "@/db/schema";

export async function approveSubmission(id: string) {
  const db = getDb();
  await db
    .update(communitySubmissions)
    .set({ status: "approved" })
    .where(eq(communitySubmissions.id, id));
  revalidatePath("/admin");
}

export async function rejectSubmission(id: string) {
  const db = getDb();
  await db
    .update(communitySubmissions)
    .set({ status: "rejected" })
    .where(eq(communitySubmissions.id, id));
  revalidatePath("/admin");
}

export async function dismissChangeReport(id: string) {
  const db = getDb();
  await db
    .update(changeReports)
    .set({ status: "dismissed" })
    .where(eq(changeReports.id, id));
  revalidatePath("/admin");
}
