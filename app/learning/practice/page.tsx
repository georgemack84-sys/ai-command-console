import Link from "next/link";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaPracticeArtifactRepository } from "@/services/learning-constitution";
import type { PracticeExercise, PracticeSession } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const artifacts = await new PrismaPracticeArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
  const exercises = artifacts.filter((artifact) => artifact.artifactType === "EXERCISE").map((artifact) => artifact.payload as PracticeExercise);
  const sessions = artifacts.filter((artifact) => artifact.artifactType === "SESSION").map((artifact) => artifact.payload as PracticeSession);
  return <main className="mx-auto max-w-5xl space-y-6 p-6"><header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 20</p><h1 className="text-2xl font-semibold">Practice Engine</h1><p className="mt-1 text-sm text-slate-600">Exercises produce auditable performance evidence. They do not directly create knowledge or mastery.</p></header><section className="grid gap-4 md:grid-cols-3"><article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Exercises</p><p className="mt-1 text-2xl font-semibold">{exercises.length}</p></article><article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Sessions</p><p className="mt-1 text-2xl font-semibold">{sessions.length}</p></article><article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Boundary</p><p className="mt-1 text-sm">Evidence only · no authority change</p></article></section><section className="rounded border p-4"><h2 className="font-medium">Exercises</h2>{exercises.length ? <ul className="mt-3 space-y-3">{exercises.map((exercise) => <li key={exercise.exerciseId} className="rounded border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{exercise.exerciseId}</p><span className="font-mono text-xs">{exercise.state}</span></div><p className="mt-1 text-sm text-slate-600">{exercise.targetSkillIds.join(", ")} · {exercise.transferLevel} (D{exercise.transferDistance}) · difficulty {exercise.difficulty}</p><p className="mt-2 text-sm">{exercise.scenario}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No practice exercises have been generated. Use the protected exercise API to submit a constrained generation request.</p>}</section><p className="text-sm"><Link className="text-violet-700 underline" href="/learning/skills">View Skill Registry</Link> · <Link className="text-violet-700 underline" href="/learning/graph">Inspect Skill Graph</Link></p></main>;
}
