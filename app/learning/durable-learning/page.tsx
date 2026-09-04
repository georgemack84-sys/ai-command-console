import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { createDeferredCandidateReviewQueue } from "@/src/server/learning/deferred-candidate-review-runtime";

export const dynamic = "force-dynamic";

export default async function DurableLearningQueuePage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") {
    return <main className="mx-auto max-w-5xl p-6"><h1 className="text-2xl font-semibold">Durable Learning Queue</h1><p className="mt-3 text-sm text-slate-600">A workspace membership is required to review deferred learning candidates.</p></main>;
  }
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const candidates = await createDeferredCandidateReviewQueue(user.workspaceId).listPending();

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-amber-700">Noesis · Phase 9</p>
        <h1 className="text-2xl font-semibold">Durable Learning Queue</h1>
        <p className="max-w-3xl text-sm text-slate-600">These candidates are provisional. Resolve their blocking evidence, approval, scope, or conflict condition, then submit them for a new gate evaluation.</p>
      </header>
      {candidates.length === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">No candidates are awaiting resolution.</section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Candidate</th><th className="p-4">Blocking reasons</th><th className="p-4">Last evaluation</th><th className="p-4">Queued</th></tr></thead>
            <tbody>{candidates.map((candidate) => <tr key={candidate.deferredCandidateId} className="border-t border-slate-100 align-top"><td className="p-4 font-mono text-xs text-slate-800">{candidate.candidateId}</td><td className="p-4"><ul className="space-y-1">{candidate.blockingReasons.map((reason) => <li key={reason} className="text-amber-800">{reason}</li>)}</ul></td><td className="p-4 font-mono text-xs text-slate-600">{candidate.lastEvaluationId}</td><td className="p-4 text-slate-600">{new Date(candidate.queuedAt).toLocaleString()}</td></tr>)}</tbody>
          </table>
        </section>
      )}
    </main>
  );
}
