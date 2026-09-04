import Link from "next/link";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaSourceCriticismArtifactRepository } from "@/services/learning-constitution";
import type { EvidenceCluster, SourceAssessment, SourceRecord } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

/** A read-only evidence-inspection surface; it never treats a citation as authority or as a command. */
export default async function SourceCriticismPage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const artifacts = await new PrismaSourceCriticismArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
  const sources = artifacts.filter((artifact) => artifact.artifactType === "SOURCE").map((artifact) => artifact.payload as SourceRecord);
  const assessments = artifacts.filter((artifact) => artifact.artifactType === "ASSESSMENT").map((artifact) => artifact.payload as SourceAssessment);
  const clusters = artifacts.filter((artifact) => artifact.artifactType === "CLUSTER").map((artifact) => artifact.payload as EvidenceCluster);

  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 29</p><h1 className="text-2xl font-semibold">Source Criticism</h1><p className="mt-1 text-sm text-slate-600">Evidence is evaluated by provenance, authority, directness, relevance, recency, independence, conflict, and scope—not citation count.</p></header>
    <section className="grid gap-4 md:grid-cols-4"><Metric label="Registered sources" value={sources.length} /><Metric label="Claim assessments" value={assessments.length} /><Metric label="Evidence clusters" value={clusters.length} /><Metric label="Authority effect" value="None" small /></section>
    <section className="rounded border p-4"><h2 className="font-medium">Evidence clusters</h2>{clusters.length ? <ul className="mt-3 space-y-3">{clusters.slice().reverse().map((cluster) => <li className="rounded border border-slate-200 p-3" key={cluster.clusterId}><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{cluster.claimId}</p><span className="font-mono text-xs">{cluster.assessment} · {cluster.strength}</span></div><p className="mt-1 text-sm text-slate-600">Independent origins: {cluster.independentOriginIds.length} · supporting publications: {cluster.supportingSourceIds.length} · conflicts: {cluster.contradictingSourceIds.length}</p><p className="mt-1 text-sm">{cluster.rationale}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No evidence clusters have been recorded.</p>}</section>
    <section className="rounded border p-4"><h2 className="font-medium">Source registry</h2>{sources.length ? <ul className="mt-3 space-y-3">{sources.slice().reverse().map((source) => { const claimAssessments = assessments.filter((assessment) => assessment.sourceId === source.sourceId); return <li className="rounded border border-slate-200 p-3" key={source.sourceId}><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{source.title}</p><span className="font-mono text-xs">{source.sourceType} · {source.status}</span></div><p className="mt-1 text-sm text-slate-600">Issuer: {source.authorOrIssuer ?? "unknown"} · retrieved {new Date(source.retrievalDate).toLocaleDateString()} · assessments: {claimAssessments.length}</p><p className="mt-1 text-sm">Declared scope: {source.declaredScope.join(", ") || "not recorded"}</p></li>; })}</ul> : <p className="mt-3 text-sm text-slate-600">No sources have been registered.</p>}</section>
    <p className="text-sm"><Link className="text-violet-700 underline" href="/learning/gaps">View Knowledge-Gap Detection</Link> · <Link className="text-violet-700 underline" href="/learning/durable-learning">View Durable Learning Gate</Link> · <Link className="text-violet-700 underline" href="/learning/predictions">View Decision Predictions</Link></p>
  </main>;
}

function Metric({ label, value, small = false }: { label: string; value: string | number; small?: boolean }) { return <article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className={small ? "mt-1 text-sm font-medium" : "mt-1 text-2xl font-semibold"}>{value}</p></article>; }
