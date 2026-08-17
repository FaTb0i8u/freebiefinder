import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { votes, communitySubmissions } from "@/db/schema";
import { checkRateLimit } from "@/lib/rateLimit";
import { hashIp, getIpFromRequest } from "@/lib/ipHash";

export async function POST(req: NextRequest) {
  try {
    const ip     = getIpFromRequest(req);
    const ipHash = hashIp(ip);

    const body = await req.json();
    const { submissionId, vote } = body;

    if (!submissionId || !vote) {
      return NextResponse.json({ error: "submissionId and vote are required" }, { status: 400 });
    }
    if (vote !== "worked" && vote !== "didnt_work") {
      return NextResponse.json({ error: "vote must be 'worked' or 'didnt_work'" }, { status: 400 });
    }

    // Rate limit: 1 vote per IP per submission per 24h
    const { success } = await checkRateLimit(`${ipHash}:${submissionId}`, "vote", 1);
    if (!success) {
      return NextResponse.json(
        { error: "You already voted on this submission today." },
        { status: 429 }
      );
    }

    const db = getDb();

    // Record the vote
    await db.insert(votes).values({ submissionId, vote, voterIpHash: ipHash });

    // Increment the counter on the submission
    if (vote === "worked") {
      await db
        .update(communitySubmissions)
        .set({ workedVotes: sql`${communitySubmissions.workedVotes} + 1` })
        .where(eq(communitySubmissions.id, submissionId));
    } else {
      await db
        .update(communitySubmissions)
        .set({ didntWorkVotes: sql`${communitySubmissions.didntWorkVotes} + 1` })
        .where(eq(communitySubmissions.id, submissionId));
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/votes error:", err);
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }
}
