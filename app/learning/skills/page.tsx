import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaSkillArtifactRepository, SkillRegistryProjectionService } from "@/services/learning-constitution";
export const dynamic = "force-dynamic";
export default async function SkillRegistryPage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const repository = new PrismaSkillArtifactRepository(user.workspaceId);
  const artifacts = await repository.listWorkspaceArtifacts();
  const skills = await new SkillRegistryProjectionService(repository).list(artifacts.filter((artifact) => artifact.artifactType === "CANDIDATE").map((artifact) => artifact.subjectId));
  return <main className="mx-auto max-w-5xl space-y-3 p-6"><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 18</p><h1 className="text-2xl font-semibold">Skill Registry</h1><p className="text-sm text-slate-600">Capability records are evidence-backed, non-authoritative, and separately distinguish demonstrated capability from execution permission.</p>{skills.length === 0 ? <p className="rounded border border-dashed p-4 text-sm text-slate-600">No skill candidates have been recorded.</p> : skills.map((entry) => <section key={entry.skill.skillId} className="rounded border p-4"><div className="flex items-baseline justify-between gap-3"><h2 className="font-medium">{entry.skill.name}</h2><span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{entry.status}</span></div><p className="mt-1 text-sm text-slate-600">{entry.skill.description}</p><dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><div><dt className="text-slate-500">Active evidence</dt><dd>{entry.activeEvidenceCount}</dd></div><div><dt className="text-slate-500">Evaluations</dt><dd>{entry.evaluationCount}</dd></div><div><dt className="text-slate-500">Observed score</dt><dd>{entry.assessment.observedScore ?? "—"}</dd></div><div><dt className="text-slate-500">Estimated mastery</dt><dd>{entry.assessment.estimatedMastery ?? "Insufficient evidence"}</dd></div></dl><p className="mt-3 text-xs text-slate-500">Execution permission: not granted. Status requires separately auditable human review.</p></section>)}</main>;
}
