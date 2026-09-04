import Link from "next/link";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaSkillDiscoveryArtifactRepository } from "@/services/learning-constitution";
import type { CandidateSkillEvaluationRequest, DiscoveredSkillCandidate, SkillDiscoveryEpisode, SkillDiscoveryReview } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

/** Read-only Phase 34 inspection. Discovery candidates are concepts, never automatic competency or mastery claims. */
export default async function SkillDiscoveryPage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const artifacts = await new PrismaSkillDiscoveryArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
  const candidates = artifacts.filter((item) => item.artifactType === "CANDIDATE").map((item) => item.payload as DiscoveredSkillCandidate);
  const episodes = artifacts.filter((item) => item.artifactType === "EPISODE").map((item) => item.payload as SkillDiscoveryEpisode);
  const reviews = artifacts.filter((item) => item.artifactType === "REVIEW").map((item) => item.payload as SkillDiscoveryReview);
  const requests = artifacts.filter((item) => item.artifactType === "EVALUATION_REQUEST").map((item) => item.payload as CandidateSkillEvaluationRequest);
  const byLifecycle = Object.entries(candidates.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.lifecycle]: (counts[item.lifecycle] ?? 0) + 1 }), {}));
  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 34</p><h1 className="text-2xl font-semibold">Skill Discovery</h1><p className="mt-1 text-sm text-slate-600">Noesis can identify a capability worth representing. Discovery confidence is not competency, mastery, or certification.</p></header>
    <section className="grid gap-4 md:grid-cols-4"><Metric label="Behavioral episodes" value={episodes.length} /><Metric label="Candidate concepts" value={candidates.length} /><Metric label="Human reviews" value={reviews.length} /><Metric label="Evaluation requests" value={requests.length} /></section>
    <section className="rounded border p-4"><h2 className="font-medium">Candidate lifecycle</h2>{byLifecycle.length ? <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{byLifecycle.sort(([left], [right]) => left.localeCompare(right)).map(([state, count]) => <div key={state} className="rounded border border-slate-200 p-3"><dt className="font-mono text-xs">{state}</dt><dd className="mt-1 text-xl font-semibold">{count}</dd></div>)}</dl> : <p className="mt-3 text-sm text-slate-600">No candidate skill concepts have been discovered.</p>}</section>
    <section className="rounded border p-4"><h2 className="font-medium">Candidate concepts</h2>{candidates.length ? <ul className="mt-3 space-y-3">{candidates.slice().sort((left, right) => right.createdAt.localeCompare(left.createdAt)).map((item) => <li key={`${item.candidateSkillId}:v${item.definitionVersion}`} className="rounded border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.name} <span className="font-mono text-xs">v{item.definitionVersion}</span></p><span className="font-mono text-xs">{item.lifecycle}</span></div><p className="mt-1 text-sm text-slate-600">{item.description}</p><p className="mt-1 text-sm text-slate-600">Episodes: {item.observedEpisodeIds.length} · comparison: {item.comparison} · discovery confidence: {Math.round(item.discoveryConfidence * 100)}%</p><p className="mt-1 text-sm text-amber-700">Competency: {item.competencyStatus} · certification: {item.certificationStatus}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">Candidate definitions will appear after recurring evidence passes discovery safeguards.</p>}</section>
    <section className="rounded border p-4"><h2 className="font-medium">Governed evaluation handoffs</h2>{requests.length ? <ul className="mt-3 space-y-2">{requests.slice().reverse().map((item) => <li key={item.requestId} className="rounded border border-slate-200 p-3"><p className="font-medium">{item.candidateSkillId} · definition v{item.definitionVersion}</p><p className="mt-1 text-sm text-slate-600">Required path: {item.requiredStages.join(" → ")}</p><p className="mt-1 text-sm text-amber-700">Status: {item.status} · certification: {item.certificationStatus}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No accepted candidates have requested governed evaluation.</p>}</section>
    <p className="text-sm"><Link className="text-violet-700 underline" href="/learning/skills">Skill Registry</Link> · <Link className="text-violet-700 underline" href="/learning/graph">Skill Graph</Link> · <Link className="text-violet-700 underline" href="/learning/evaluations">Evaluation Engine</Link> · <Link className="text-violet-700 underline" href="/learning/retention">Retention Engine</Link></p>
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>; }
