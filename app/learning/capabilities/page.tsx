import Link from "next/link";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaCapabilityArtifactRepository } from "@/services/learning-constitution";
import type { CapabilityGrant, CapabilityGrantLifecycleEvent, CapabilityRequest } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

/** Read-only Phase 35 registry view. Competence and certification are evidence only, never an authority shortcut. */
export default async function CapabilityRegistryPage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const artifacts = await new PrismaCapabilityArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
  const requests = artifacts.filter((item) => item.artifactType === "REQUEST").map((item) => item.payload as CapabilityRequest);
  const grants = artifacts.filter((item) => item.artifactType === "GRANT").map((item) => item.payload as CapabilityGrant);
  const lifecycle = artifacts.filter((item) => item.artifactType === "LIFECYCLE").map((item) => item.payload as CapabilityGrantLifecycleEvent);
  const now = Date.now();
  const active = grants.filter((grant) => grant.status === "ACTIVE" && Date.parse(grant.expiresAt) > now && !lifecycle.some((event) => event.grantId === grant.grantId && ["SUSPENDED", "REVOKED", "EXPIRED", "CLOSED"].includes(event.to)));
  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 35</p><h1 className="text-2xl font-semibold">Capability Boundary</h1><p className="mt-1 text-sm text-slate-600">Competence may support a request. Only a separate, scoped, active human authorization may permit an operation.</p></header>
    <section className="grid gap-4 md:grid-cols-4"><Metric label="Capability requests" value={requests.length} /><Metric label="Recorded grants" value={grants.length} /><Metric label="Active grants" value={active.length} /><Metric label="Lifecycle events" value={lifecycle.length} /></section>
    <section className="rounded border border-amber-200 bg-amber-50 p-4"><h2 className="font-medium text-amber-900">Constitutional STOP</h2><p className="mt-1 text-sm text-amber-800">Learning, certification, retention, adversarial success, and tool availability do not create permission. This view is inspection only.</p></section>
    <section className="rounded border p-4"><h2 className="font-medium">Capability grants</h2>{grants.length ? <ul className="mt-3 space-y-3">{grants.slice().reverse().map((grant) => <li key={grant.grantId} className="rounded border border-slate-200 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{grant.capability}</p><span className="font-mono text-xs">{effectiveStatus(grant, lifecycle)}</span></div><p className="mt-1 text-sm text-slate-600">Actor: {grant.actor.actorId} · resource: {grant.resourceId} · operations: {grant.operations.join(", ")}</p><p className="mt-1 text-sm text-slate-600">Scope: {grant.scope.join(", ")} · expires: {new Date(grant.expiresAt).toLocaleString()} · granted by: {grant.grantedBy.actorId}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No capability grants have been recorded.</p>}</section>
    <section className="rounded border p-4"><h2 className="font-medium">Capability requests</h2>{requests.length ? <ul className="mt-3 space-y-2">{requests.slice().reverse().map((request) => <li key={request.requestId} className="rounded border border-slate-200 p-3"><p className="font-medium">{request.capability} · {request.status}</p><p className="mt-1 text-sm text-slate-600">{request.actor.actorId} requests {request.operations.join(", ")} on {request.resourceId} for {request.requestedDurationMinutes} minutes.</p><p className="mt-1 text-sm text-amber-700">Supporting certifications are evidence only; request status does not authorize execution.</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No capability requests have been recorded.</p>}</section>
    <p className="text-sm"><Link className="text-violet-700 underline" href="/learning/skills">Skill Registry</Link> · <Link className="text-violet-700 underline" href="/learning/retention">Retention Engine</Link> · <Link className="text-violet-700 underline" href="/learning/skill-discovery">Skill Discovery</Link></p>
  </main>;
}

function effectiveStatus(grant: CapabilityGrant, events: readonly CapabilityGrantLifecycleEvent[]) { return events.filter((event) => event.grantId === grant.grantId).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0]?.to ?? (Date.parse(grant.expiresAt) <= Date.now() ? "EXPIRED" : grant.status); }
function Metric({ label, value }: { label: string; value: number }) { return <article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>; }
