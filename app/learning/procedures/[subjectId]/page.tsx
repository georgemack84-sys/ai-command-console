import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaProcedureArtifactRepository } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

export default async function ProcedureHistoryPage({ params }: Readonly<{ params: Promise<{ subjectId: string }> }>) {
  const user = await requireSessionUser(); const { subjectId } = await params;
  if (!user.workspaceId || user.workspaceId === "default") return <main className="mx-auto max-w-5xl p-6"><h1 className="text-2xl font-semibold">Procedure History</h1><p className="mt-3 text-sm text-slate-600">A workspace membership is required.</p></main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const artifacts = await new PrismaProcedureArtifactRepository(user.workspaceId).listArtifacts(subjectId);
  return <main className="mx-auto max-w-5xl space-y-6 p-6"><header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 14</p><h1 className="mt-2 text-2xl font-semibold">Procedure History</h1><p className="mt-2 font-mono text-sm text-slate-600">{subjectId}</p></header>{!artifacts.length ? <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">No procedure artifacts have been recorded for this subject.</section> : artifacts.map((artifact) => <section key={artifact.artifactId} className="rounded-lg border border-slate-200 bg-white p-5"><p className="font-mono text-xs text-slate-500">{artifact.artifactType} · {artifact.createdAt}</p><pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{JSON.stringify(artifact.payload, null, 2)}</pre></section>)}</main>;
}
