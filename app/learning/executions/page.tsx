import Link from "next/link";
import { requireSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaGovernedExecutionArtifactRepository } from "@/services/learning-constitution";
import type { LearningExecutionSession, LearningExecutionTimelineEvent } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

/** Inspection only: execution is authorized and launched by governed services, never from this page. */
export default async function GovernedExecutionsPage() {
  const user = await requireSessionUser();
  if (!user.workspaceId || user.workspaceId === "default") return <main className="p-6">Workspace membership required.</main>;
  await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

  const artifacts = await new PrismaGovernedExecutionArtifactRepository(user.workspaceId).listWorkspaceArtifacts();
  const sessions = artifacts.filter((artifact) => artifact.artifactType === "SESSION").map((artifact) => artifact.payload as LearningExecutionSession);
  const events = artifacts.filter((artifact) => artifact.artifactType === "TIMELINE").map((artifact) => artifact.payload as LearningExecutionTimelineEvent);
  const halted = sessions.filter((session) => session.status === "HALTED").length;

  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header>
      <p className="text-sm font-medium uppercase tracking-wide text-violet-700">Noesis · Phase 28</p>
      <h1 className="text-2xl font-semibold">Governed Learning Timeline</h1>
      <p className="mt-1 text-sm text-slate-600">A read-only audit view. A curriculum or proposal never grants execution authority; each action requires its active lease.</p>
    </header>
    <section className="grid gap-4 md:grid-cols-4">
      <Metric label="Execution sessions" value={sessions.length} />
      <Metric label="Timeline events" value={events.length} />
      <Metric label="Halted sessions" value={halted} />
      <Metric label="Durable-learning effect" value="None directly" small />
    </section>
    <section className="rounded border p-4">
      <h2 className="font-medium">Authority-bound sessions</h2>
      {sessions.length ? <ul className="mt-3 space-y-3">{sessions.slice().reverse().map((session) => <li key={session.sessionId} className="rounded border border-slate-200 p-3">
        <div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{session.curriculumId}</p><span className="font-mono text-xs">{session.status}</span></div>
        <p className="mt-1 text-sm text-slate-600">Session {session.sessionId} · lease {session.leaseId} · started {new Date(session.startedAt).toLocaleString()}</p>
        <p className="mt-1 text-sm">{session.haltReason ? `Halted: ${session.haltReason}` : "No halt reason recorded."} · Direct durable writes: prohibited.</p>
      </li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No governed learning sessions have been recorded.</p>}
    </section>
    <section className="rounded border p-4">
      <h2 className="font-medium">Execution trail</h2>
      {events.length ? <ol className="mt-3 space-y-3">{events.slice().reverse().map((event) => <li key={event.eventId} className="border-l-2 border-violet-300 pl-3">
        <div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{event.status}{event.mechanism ? ` · ${event.mechanism}` : ""}</p><time className="text-xs text-slate-500">{new Date(event.occurredAt).toLocaleString()}</time></div>
        <p className="text-sm text-slate-600">{event.curriculumId} · lease {event.leaseId} · target {event.targetSkillId ?? "—"}</p>
        <p className="text-sm">{event.reason}</p>
      </li>)}</ol> : <p className="mt-3 text-sm text-slate-600">The timeline will appear after a valid lease authorizes an execution action.</p>}
    </section>
    <p className="text-sm"><Link className="text-violet-700 underline" href="/learning/proposals">View learning proposals and leases</Link> · <Link className="text-violet-700 underline" href="/learning/practice">View Practice Engine</Link> · <Link className="text-violet-700 underline" href="/learning/reflections">View Reflection Engine</Link></p>
  </main>;
}

function Metric({ label, value, small = false }: { label: string; value: string | number; small?: boolean }) {
  return <article className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className={small ? "mt-1 text-sm font-medium" : "mt-1 text-2xl font-semibold"}>{value}</p></article>;
}
