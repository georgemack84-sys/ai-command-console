import Link from "next/link";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaAdversarialExaminationArtifactRepository } from "@/services/learning-constitution";
import type { AdversarialEvidence, AdversarialExam, ExaminerFinding, MasteryReassessmentRecommendation } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

/** Inspection only; hidden examiner rationales and rubrics are intentionally never queried for display. */
export default async function AdversarialExamsPage() {
  const user = await requireSessionUser(); if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const all = await new PrismaAdversarialExaminationArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
  const exams = all.filter((artifact) => artifact.artifactType === "EXAM").map((artifact) => artifact.payload as AdversarialExam);
  const findings = all.filter((artifact) => artifact.artifactType === "FINDING").map((artifact) => artifact.payload as ExaminerFinding);
  const evidence = all.filter((artifact) => artifact.artifactType === "EVIDENCE").map((artifact) => artifact.payload as AdversarialEvidence);
  const reassessments = all.filter((artifact) => artifact.artifactType === "REASSESSMENT").map((artifact) => artifact.payload as MasteryReassessmentRecommendation);
  const sealedRubrics = all.filter((artifact) => artifact.artifactType === "RUBRIC").length;
  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 32</p><h1 className="text-2xl font-semibold">Adversarial Examiner</h1><p className="mt-1 text-sm text-slate-600">The examiner seeks falsifying evidence for competency claims. Findings are evidence, not automatic knowledge or mastery changes.</p></header>
    <section className="grid gap-4 md:grid-cols-4"><Metric label="Active/recorded exams" value={exams.length} /><Metric label="Examiner findings" value={findings.length} /><Metric label="Adversarial evidence" value={evidence.length} /><Metric label="Sealed rubrics" value={sealedRubrics} /></section>
    <section className="rounded border p-4"><h2 className="font-medium">Competency challenges</h2>{exams.length ? <ul className="mt-3 space-y-3">{exams.slice().reverse().map((exam) => <li key={exam.examId} className="rounded border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{exam.skillId} · claim {exam.competencyClaimId}</p><span className="font-mono text-xs">{exam.status}</span></div><p className="mt-1 text-sm text-slate-600">Lease {exam.lease.leaseId} · tests {exam.testsUsed}/{exam.maximumTests} · separate contexts: {String(exam.examinerContextHash !== exam.learnerContextHash)}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No adversarial exams have been recorded.</p>}</section>
    <section className="rounded border p-4"><h2 className="font-medium">Findings and review recommendations</h2>{findings.length || reassessments.length ? <ul className="mt-3 space-y-3">{findings.slice().reverse().map((finding) => <li key={finding.findingId} className="rounded border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{finding.outcome}</p><span className="font-mono text-xs">challenge: {finding.challengeStatus}</span></div><p className="mt-1 text-sm text-slate-600">Failure classes: {finding.failureClasses.join(", ") || "none"} · calibration concern: {String(finding.confidenceCalibrationConcern)}</p><p className="mt-1 text-sm">{finding.diagnosticRationale}</p></li>)}{reassessments.slice().reverse().map((item) => <li key={item.recommendationId} className="rounded border border-amber-200 p-3"><p className="font-medium">Review recommendation: {item.action}</p><p className="mt-1 text-sm text-slate-600">Skill {item.skillId} · review required: {String(item.requiresReview)} · this does not mutate mastery automatically.</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No findings or reassessment recommendations have been recorded.</p>}</section>
    <p className="text-sm"><Link className="text-violet-700 underline" href="/learning/autonomous-practice">View Autonomous Practice</Link> · <Link className="text-violet-700 underline" href="/learning/evaluations">View Evaluation Engine</Link> · <Link className="text-violet-700 underline" href="/learning/reflections">View Reflection Engine</Link></p>
  </main>;
}
function Metric({ label, value }: { label: string; value: number }) { return <article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>; }
