import Link from "next/link";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaRetentionArtifactRepository } from "@/services/learning-constitution";
import type { RetentionActivityTransition, RetentionEvidence, RetentionRecord } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

/** Read-only Phase 33 view. It reports evidence-backed retention, never grants or changes mastery. */
export default async function RetentionPage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const artifacts = await new PrismaRetentionArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
  const records = artifacts.filter((item) => item.artifactType === "RECORD").map((item) => item.payload as RetentionRecord);
  const evidence = artifacts.filter((item) => item.artifactType === "EVIDENCE").map((item) => item.payload as RetentionEvidence);
  const activity = artifacts.filter((item) => item.artifactType === "ACTIVITY_TRANSITION").map((item) => item.payload as RetentionActivityTransition);
  const now = Date.now();
  const byStage = Object.entries(records.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.stage]: (counts[item.stage] ?? 0) + 1 }), {}));
  const due = records.filter((item) => item.nextReviewAt && Date.parse(item.nextReviewAt) <= now && !item.remediationRequired);
  const atRisk = records.filter((item) => item.stage === "RETENTION_AT_RISK" || item.stage === "DEGRADED" || item.stage === "REMEDIATION_REQUIRED");
  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 33</p><h1 className="text-2xl font-semibold">Retention Engine</h1><p className="mt-1 text-sm text-slate-600">Retention reflects fresh, valid demonstrations over time. It is distinct from mastery and never changes knowledge or authority automatically.</p></header>
    <section className="grid gap-4 md:grid-cols-4"><Metric label="Tracked competencies" value={records.length} /><Metric label="Reviews due" value={due.length} /><Metric label="At risk / remediation" value={atRisk.length} /><Metric label="Retention evidence" value={evidence.length} /></section>
    <section className="rounded border p-4"><h2 className="font-medium">Retention stages</h2>{byStage.length ? <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{byStage.sort(([left], [right]) => left.localeCompare(right)).map(([stage, count]) => <div key={stage} className="rounded border border-slate-200 p-3"><dt className="font-mono text-xs">{stage}</dt><dd className="mt-1 text-xl font-semibold">{count}</dd></div>)}</dl> : <p className="mt-3 text-sm text-slate-600">No competencies are in the retention lifecycle yet.</p>}</section>
    <section className="rounded border p-4"><h2 className="font-medium">Competencies</h2>{records.length ? <ul className="mt-3 space-y-3">{records.slice().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).map((item) => <li key={item.retentionId} className="rounded border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.skillId}</p><span className="font-mono text-xs">{item.stage}</span></div><p className="mt-1 text-sm text-slate-600">Evidence: {item.evidenceIds.length} · last success: {format(item.lastSuccessfulDemonstrationAt)} · last failure: {format(item.lastFailureAt)}</p><p className="mt-1 text-sm text-slate-600">Next review: {format(item.nextReviewAt)} · remediation required: {String(item.remediationRequired)}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">Retention records will appear after a skill enters the lifecycle.</p>}</section>
    <section className="rounded border p-4"><h2 className="font-medium">Recent lifecycle activity</h2>{activity.length ? <ul className="mt-3 space-y-2">{activity.slice().reverse().slice(0, 10).map((item, index) => <li key={`${item.retentionId}:${item.createdAt}:${index}`} className="text-sm text-slate-700"><span className="font-mono text-xs">{item.from} → {item.to}</span> · {item.reason}</li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No activity transitions recorded.</p>}</section>
    <p className="text-sm"><Link className="text-violet-700 underline" href="/learning/evaluations">Evaluation Engine</Link> · <Link className="text-violet-700 underline" href="/learning/reflections">Reflection Engine</Link> · <Link className="text-violet-700 underline" href="/learning/adversarial-exams">Adversarial Examiner</Link></p>
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>; }
function format(value: string | null) { return value ? new Date(value).toLocaleString() : "—"; }
