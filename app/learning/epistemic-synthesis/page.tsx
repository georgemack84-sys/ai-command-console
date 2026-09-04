import Link from "next/link";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaEpistemicSynthesisArtifactRepository } from "@/services/learning-constitution";
import type { EpistemicAssumption, EpistemicDebt, EpistemicPosition, EpistemicProposition } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

/** Read-only record of what the evidence currently justifies believing; positions are not directives or durable knowledge. */
export default async function EpistemicSynthesisPage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const artifacts = await new PrismaEpistemicSynthesisArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
  const propositions = artifacts.filter((artifact) => artifact.artifactType === "PROPOSITION").map((artifact) => artifact.payload as EpistemicProposition);
  const positions = artifacts.filter((artifact) => artifact.artifactType === "POSITION").map((artifact) => artifact.payload as EpistemicPosition);
  const assumptions = artifacts.filter((artifact) => artifact.artifactType === "ASSUMPTION").map((artifact) => artifact.payload as EpistemicAssumption);
  const openDebt = artifacts.filter((artifact) => artifact.artifactType === "DEBT").map((artifact) => artifact.payload as EpistemicDebt).filter((debt) => debt.status === "OPEN");
  const latestByProposition = new Map<string, EpistemicPosition>(); for (const position of positions) latestByProposition.set(position.propositionId, position);

  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 30</p><h1 className="text-2xl font-semibold">Epistemic Synthesis</h1><p className="mt-1 text-sm text-slate-600">A belief is a scoped, revisable evidence position—not durable knowledge, a human directive, or permission to act.</p></header>
    <section className="grid gap-4 md:grid-cols-4"><Metric label="Propositions" value={propositions.length} /><Metric label="Current positions" value={latestByProposition.size} /><Metric label="Unverified assumptions" value={assumptions.filter((assumption) => assumption.status === "UNVERIFIED").length} /><Metric label="Open epistemic debt" value={openDebt.length} /></section>
    <section className="rounded border p-4"><h2 className="font-medium">Current evidence positions</h2>{propositions.length ? <ul className="mt-3 space-y-3">{propositions.slice().reverse().map((proposition) => { const position = latestByProposition.get(proposition.propositionId); return <li className="rounded border border-slate-200 p-3" key={proposition.propositionId}><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{proposition.statement}</p><span className="font-mono text-xs">{position?.status ?? "UNASSESSED"}{position ? ` · ${position.confidence}` : ""}</span></div><p className="mt-1 text-sm text-slate-600">Scope: {proposition.scope.join(" · ")} · valid {proposition.validFrom ?? "unspecified"} → {proposition.validTo ?? "current"}</p>{position ? <><p className="mt-1 text-sm">{position.explanation}</p><p className="mt-1 text-sm text-slate-600">Uncertainties: {position.uncertainties.join("; ") || "none recorded"}</p></> : <p className="mt-1 text-sm text-slate-600">No synthesis snapshot has assessed this proposition.</p>}</li>; })}</ul> : <p className="mt-3 text-sm text-slate-600">No epistemic propositions have been registered.</p>}</section>
    <section className="rounded border p-4"><h2 className="font-medium">Explicit assumptions and debt</h2>{assumptions.length || openDebt.length ? <ul className="mt-3 space-y-2 text-sm">{assumptions.filter((assumption) => assumption.status === "UNVERIFIED").map((assumption) => <li key={assumption.assumptionId}><strong>Assumption:</strong> {assumption.statement} · {assumption.status}</li>)}{openDebt.map((debt) => <li key={debt.debtId}><strong>Debt:</strong> {debt.weaknesses.join("; ")} · proposition {debt.propositionId}</li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No unresolved assumptions or epistemic debt have been recorded.</p>}</section>
    <p className="text-sm"><Link className="text-violet-700 underline" href="/learning/sources">View Source Criticism</Link> · <Link className="text-violet-700 underline" href="/learning/gaps">View Knowledge-Gap Detection</Link> · <Link className="text-violet-700 underline" href="/learning/durable-learning">View Durable Learning Gate</Link></p>
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>; }
