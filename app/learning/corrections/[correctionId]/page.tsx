import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaCorrectionRepository } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

export default async function CorrectionReviewPage({ params }: Readonly<{ params: Promise<{ correctionId: string }> }>) {
  const user = await requireSessionUser(); const { correctionId } = await params;
  if (!user.workspaceId || user.workspaceId === "default") return <main className="mx-auto max-w-5xl p-6"><h1 className="text-2xl font-semibold">Correction Review</h1><p className="mt-3 text-sm text-slate-600">A workspace membership is required.</p></main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const correction = await new PrismaCorrectionRepository(user.workspaceId).get(correctionId);
  if (!correction) return <main className="mx-auto max-w-5xl p-6"><h1 className="text-2xl font-semibold">Correction Review</h1><p className="mt-3 text-sm text-slate-600">No correction record was found.</p></main>;
  return <main className="mx-auto max-w-5xl space-y-6 p-6"><header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 12</p><h1 className="mt-2 text-2xl font-semibold">Correction Review</h1><p className="mt-2 font-mono text-sm text-slate-600">{correction.correctionId}</p><p className="mt-2 text-sm">{correction.signal.sourceText}</p></header><section className="rounded-lg border border-slate-200 bg-white p-5 text-sm"><h2 className="font-semibold">Analysis</h2>{correction.analyses.length ? correction.analyses.map((analysis) => <p key={analysis.analyzedAt} className="mt-2">{analysis.errorType} · {analysis.severity} · {analysis.targetResolution}</p>) : <p className="mt-2 text-slate-500">Awaiting analysis.</p>}</section><section className="rounded-lg border border-slate-200 bg-white p-5 text-sm"><h2 className="font-semibold">Impact and repair</h2><p className="mt-2">{correction.impacts.length} potentially affected dependent record(s).</p>{correction.plans.length ? correction.plans.map((plan) => <p key={plan.planId} className="mt-2">{plan.operation} · {plan.authorization}</p>) : <p className="mt-2 text-slate-500">No repair plan recorded.</p>}</section><section className="rounded-lg border border-slate-200 bg-white p-5 text-sm"><h2 className="font-semibold">Regression evidence</h2>{correction.retests.length ? correction.retests.map((retest) => <p key={retest.retestId} className="mt-2">{retest.outcome} · {retest.actualBehavior}</p>) : <p className="mt-2 text-slate-500">No retest evidence recorded.</p>}</section></main>;
}
