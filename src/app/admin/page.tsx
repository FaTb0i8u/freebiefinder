import { eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { communitySubmissions, changeReports } from "@/db/schema";
import { approveSubmission, rejectSubmission, dismissChangeReport } from "./actions";

interface AdminPageProps {
  searchParams: Promise<{ key?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { key } = await searchParams;
  const adminKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKey || key !== adminKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-lg font-semibold text-red-400">401 — Unauthorized</p>
      </div>
    );
  }

  let pending: typeof communitySubmissions.$inferSelect[] = [];
  let reports: typeof changeReports.$inferSelect[] = [];
  let dbError = false;

  try {
    const db = getDb();
    [pending, reports] = await Promise.all([
      db.select().from(communitySubmissions).where(eq(communitySubmissions.status, "pending")),
      db.select().from(changeReports).where(eq(changeReports.status, "open")),
    ]);
  } catch {
    dbError = true;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="mx-auto max-w-4xl space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">🎂 FreebieFinder Admin</h1>
          <p className="mt-1 text-sm text-zinc-400">Moderate community submissions and change reports.</p>
        </div>

        {dbError && (
          <div className="rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300 ring-1 ring-red-800">
            ⚠️ Database not connected. Set DATABASE_URL in environment variables.
          </div>
        )}

        {/* Pending Submissions */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-200">
            Pending Submissions
            <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-sm text-amber-400">
              {pending.length}
            </span>
          </h2>

          {pending.length === 0 ? (
            <p className="text-sm text-zinc-500">No pending submissions.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((sub) => (
                <div key={sub.id} className="rounded-lg bg-zinc-900 p-4 ring-1 ring-zinc-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{sub.businessName}</p>
                      <p className="text-sm text-zinc-300">🎁 {sub.whatYouGet}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5">{sub.category}</span>
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5">{sub.claimMethod}</span>
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5">{sub.claimWindow}</span>
                        <span className="rounded bg-emerald-900/40 px-1.5 py-0.5 text-emerald-400">
                          👍 {sub.workedVotes}
                        </span>
                        <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-red-400">
                          👎 {sub.didntWorkVotes}
                        </span>
                      </div>
                      {sub.claimWindowNotes && (
                        <p className="text-xs text-zinc-500">{sub.claimWindowNotes}</p>
                      )}
                      {sub.requirements && sub.requirements.length > 0 && (
                        <ul className="text-xs text-zinc-500">
                          {sub.requirements.map((r, i) => <li key={i}>• {r}</li>)}
                        </ul>
                      )}
                      <a
                        href={sub.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 underline"
                      >
                        {sub.sourceUrl}
                      </a>
                      <p className="text-xs text-zinc-600">
                        Submitted: {sub.submittedAt?.toLocaleDateString() ?? "unknown"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-2">
                      <form action={approveSubmission.bind(null, sub.id)}>
                        <button
                          type="submit"
                          className="w-full rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                          ✓ Approve
                        </button>
                      </form>
                      <form action={rejectSubmission.bind(null, sub.id)}>
                        <button
                          type="submit"
                          className="w-full rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                        >
                          ✕ Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Change Reports */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-200">
            Open Change Reports
            <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-sm text-amber-400">
              {reports.length}
            </span>
          </h2>

          {reports.length === 0 ? (
            <p className="text-sm text-zinc-500">No open change reports.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-lg bg-zinc-900 p-4 ring-1 ring-zinc-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-zinc-400">Freebie ID: {report.freebieId}</p>
                      <p className="text-sm text-zinc-200">{report.description}</p>
                      <div className="flex gap-2 text-xs">
                        <span className="rounded bg-emerald-900/40 px-1.5 py-0.5 text-emerald-400">
                          ✓ True: {report.trueVotes}
                        </span>
                        <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-red-400">
                          ✕ False: {report.falseVotes}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600">
                        Reported: {report.createdAt?.toLocaleDateString() ?? "unknown"}
                      </p>
                    </div>
                    <form action={dismissChangeReport.bind(null, report.id)}>
                      <button
                        type="submit"
                        className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-600"
                      >
                        Dismiss
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
