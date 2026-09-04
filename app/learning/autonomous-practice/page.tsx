import Link from "next/link";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaAutonomousPracticeArtifactRepository } from "@/services/learning-constitution";
import type { AutonomousPracticeEvidence, AutonomousPracticeSession, AutonomousExerciseSnapshot } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

/** Read-only governance view. It intentionally never loads or renders evaluator-only answer-key payloads. */
export default async function AutonomousPracticePage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const all = await new PrismaAutonomousPracticeArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
  const sessions = all.filter((artifact) => artifact.artifactType === "SESSION").map((artifact) => artifact.payload as AutonomousPracticeSession);
  const exercises = all.filter((artifact) => artifact.artifactType === "EXERCISE_SNAPSHOT").map((artifact) => artifact.payload as AutonomousExerciseSnapshot);
  const evidence = all.filter((artifact) => artifact.artifactType === "EVIDENCE").map((artifact) => artifact.payload as AutonomousPracticeEvidence);
  const stops = all.filter((artifact) => artifact.artifactType === "STOP");
  const sealedKeys = all.filter((artifact) => artifact.artifactType === "SEALED_ANSWER_KEY").length;

  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 31</p><h1 className="text-2xl font-semibold">Autonomous Practice</h1><p className="mt-1 text-sm text-slate-600">Practice autonomy is not knowledge authority. Exercises and evidence remain governed; evaluator-only answer keys are never displayed here.</p></header>
    <section className="grid gap-4 md:grid-cols-4"><Metric label="Lease-bound sessions" value={sessions.length} /><Metric label="Frozen exercises" value={exercises.length} /><Metric label="Practice evidence" value={evidence.length} /><Metric label="Sealed answer keys" value={sealedKeys} /></section>
    <section className="rounded border p-4"><h2 className="font-medium">Session authority and stop trail</h2>{sessions.length ? <ul className="mt-3 space-y-3">{sessions.slice().reverse().map((session) => <li key={session.sessionId} className="rounded border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{session.skillId} · {session.targetDimensions.join(", ")}</p><span className="font-mono text-xs">{session.status}</span></div><p className="mt-1 text-sm text-slate-600">Lease {session.lease.leaseId} · curriculum {session.curriculumId} · exercises {session.exercisesUsed}/{session.maximumExercises}</p><p className="mt-1 text-sm">{session.haltReason ? `Halted: ${session.haltReason}` : "No recorded halt."}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No autonomous practice sessions have been recorded.</p>}</section>
    <section className="rounded border p-4"><h2 className="font-medium">Evidence quality</h2>{evidence.length ? <ul className="mt-3 space-y-3">{evidence.slice().reverse().map((item) => <li key={item.evidenceId} className="rounded border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.outcome} · {item.evidenceQuality}</p><span className="font-mono text-xs">{item.practiceEvidenceStrength}</span></div><p className="mt-1 text-sm text-slate-600">Isolation: {item.isolation} · evaluator independent: {String(item.evaluatorIndependent)} · answer exposed before commit: {String(item.answerExposureBeforeCommit)}</p><p className="mt-1 text-sm">Registry effect: evidence only; no mastery or durable-knowledge promotion.</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No autonomous-practice evidence has been recorded.</p>}</section>
    <p className="text-sm"><Link className="text-violet-700 underline" href="/learning/practice">View Practice Engine</Link> · <Link className="text-violet-700 underline" href="/learning/reflections">View Reflection Engine</Link> · <Link className="text-violet-700 underline" href="/learning/executions">View Governed Execution</Link></p>
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>; }
