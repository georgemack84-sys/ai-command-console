import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { GateObservabilityService, PrismaGateAuditLedger } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

const Metric = ({ label, value }: Readonly<{ label: string; value: string | number }>) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p></section>
);

export default async function DurableLearningHealthPage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="mx-auto max-w-5xl p-6"><h1 className="text-2xl font-semibold">Durable Learning Health</h1><p className="mt-3 text-sm text-slate-600">A workspace membership is required to inspect gate health.</p></main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const health = await new GateObservabilityService(new PrismaGateAuditLedger(user.workspaceId)).summarize();

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2"><p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Noesis · Phase 9</p><h1 className="text-2xl font-semibold">Durable Learning Health</h1><p className="max-w-3xl text-sm text-slate-600">Read-only signals derived from the immutable gate audit ledger. A verified ledger is required for trustworthy metrics.</p></header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Evaluations" value={health.totalEvaluations} /><Metric label="Accepted" value={health.outcomes.ACCEPT} /><Metric label="Deferred" value={health.outcomes.DEFER} /><Metric label="Rejected" value={health.outcomes.REJECT} />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Constitutional vetoes" value={health.constitutionalVetoCount} /><Metric label="Validation failures" value={health.validationFailureCount} /><Metric label="Conflict deferrals" value={health.conflictDeferralCount} /><Metric label="Re-evaluations" value={health.reEvaluationCount} />
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700"><dl className="grid gap-3 sm:grid-cols-3"><div><dt className="text-slate-500">Audit integrity</dt><dd className="mt-1 font-medium">{health.auditIntegrity}</dd></div><div><dt className="text-slate-500">Gate version</dt><dd className="mt-1 font-medium">{health.currentGateVersion ?? "No evaluations"}</dd></div><div><dt className="text-slate-500">Latest evaluation</dt><dd className="mt-1 font-medium">{health.latestEvaluationAt ? new Date(health.latestEvaluationAt).toLocaleString() : "No evaluations"}</dd></div></dl></section>
    </main>
  );
}
