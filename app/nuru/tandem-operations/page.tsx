import Link from "next/link";
import { TandemPilotCandidateSubmission } from "@/components/tandem/TandemPilotCandidateSubmission";
import { requireNuruGovernorPage } from "@/src/server/api/nuru-api";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { countStaleTandemRevisionRequests, tandemRevisionStaleBefore } from "@/src/server/services/nuru-tandem-knowledge-intake-service";

export const dynamic = "force-dynamic";

type RecentPackage = { missionId: string; packageId: string; attachedAt: Date };
type CandidateReceipt = { candidateId: string; curationProposalId: string; receivedAt: Date; payload: { subject?: string; revisionOfCandidateId?: string } };
type RecentDelivery = { missionId: string; updateId: string; deliveredAt: Date };
type TandemOperationsRepository = {
  tandemMissionKnowledgePackage: { count(args: { where: { workspaceId: string } }): Promise<number>; findMany(args: { where: { workspaceId: string }; orderBy: { attachedAt: "desc" }; take: number }): Promise<RecentPackage[]> };
  tandemKnowledgeCandidateReceipt: { count(args: { where: { workspaceId: string } }): Promise<number>; findMany(args: unknown): Promise<CandidateReceipt[]> };
  nuruRelationship: { count(args: { where: { status: string } }): Promise<number> };
  nuruCurationProposal: { count(args: { where: { status: string } }): Promise<number>; findMany(args: unknown): Promise<Array<{ id: string; status: string; reviewedAt: Date | null }>> };
  tandemKnowledgeSubscriptionDelivery: { count(args: Record<string, never>): Promise<number>; findMany(args: { orderBy: { deliveredAt: "desc" }; take: number }): Promise<RecentDelivery[]> };
};

const formatTime = (value: Date) => value.toLocaleString();

export default async function TandemOperationsPage() {
  const user = await requireNuruGovernorPage("/nuru/tandem-operations");
  const repo = nuruKnowledgeRepository as unknown as TandemOperationsRepository;
  const [packages, candidates, relationships, deliveries, needsReview, recentPackages, recentCandidates, candidateReceipts, recentDeliveries] = await Promise.all([
    repo.tandemMissionKnowledgePackage.count({ where: { workspaceId: user.workspaceId } }),
    repo.tandemKnowledgeCandidateReceipt.count({ where: { workspaceId: user.workspaceId } }),
    repo.nuruRelationship.count({ where: { status: "APPROVED" } }),
    repo.tandemKnowledgeSubscriptionDelivery.count({}),
    repo.nuruCurationProposal.count({ where: { status: "HUMAN_REVIEW_REQUIRED" } }),
    repo.tandemMissionKnowledgePackage.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { attachedAt: "desc" }, take: 5 }),
    repo.tandemKnowledgeCandidateReceipt.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { receivedAt: "desc" }, take: 5 }),
    repo.tandemKnowledgeCandidateReceipt.findMany({ where: { workspaceId: user.workspaceId }, select: { candidateId: true, curationProposalId: true, payload: true }, take: 1000 }),
    repo.tandemKnowledgeSubscriptionDelivery.findMany({ orderBy: { deliveredAt: "desc" }, take: 5 }),
  ]);
  const revisionProposals = await repo.nuruCurationProposal.findMany({ where: { status: "REQUEST_CHANGES", reviewedAt: { lte: tandemRevisionStaleBefore() } }, select: { id: true, status: true, reviewedAt: true } });
  const staleRevisionRequests = countStaleTandemRevisionRequests(revisionProposals.map((proposal) => proposal.id), candidateReceipts);

  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header><p className="text-sm font-medium uppercase tracking-wide text-violet-700">Nuru · Tandem Operations</p><h1 className="text-2xl font-semibold">Knowledge federation dashboard</h1><p className="mt-1 text-sm text-slate-600">Operational visibility for governed Nuru knowledge used by Tandem.</p></header>
    <section className="grid gap-4 md:grid-cols-6">{[["Mission packages", packages], ["Candidate receipts", candidates], ["Needs review", needsReview], ["Stale revisions", staleRevisionRequests], ["Approved relationships", relationships], ["Subscription deliveries", deliveries]].map(([label, value]) => <article key={String(label)} className="rounded border p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>)}</section>
    <section className="grid gap-4 md:grid-cols-3">
      <article className="rounded border p-4"><h2 className="font-medium">Recent packages</h2><ul className="mt-2 space-y-2 text-sm text-slate-600">{recentPackages.length ? recentPackages.map((item) => <li key={item.packageId}><p>{item.missionId}</p><p className="text-xs text-slate-500">Attached {formatTime(item.attachedAt)}</p></li>) : <li>No packages yet.</li>}</ul></article>
      <article className="rounded border p-4"><h2 className="font-medium">Recent candidates</h2><ul className="mt-2 space-y-2 text-sm text-slate-600">{recentCandidates.length ? recentCandidates.map((item) => <li key={item.candidateId}><p>{item.payload.subject ?? "Untitled candidate"}</p><p className="text-xs text-slate-500">{item.payload.revisionOfCandidateId ? `Revision of ${item.payload.revisionOfCandidateId} · ` : ""}Received {formatTime(item.receivedAt)}</p></li>) : <li>No candidates yet.</li>}</ul></article>
      <article className="rounded border p-4"><h2 className="font-medium">Recent deliveries</h2><ul className="mt-2 space-y-2 text-sm text-slate-600">{recentDeliveries.length ? recentDeliveries.map((item) => <li key={item.updateId}><p>{item.missionId}</p><p className="text-xs text-slate-500">Delivered {formatTime(item.deliveredAt)}</p></li>) : <li>No deliveries yet.</li>}</ul></article>
    </section>
    <TandemPilotCandidateSubmission />
    <p className="text-sm text-slate-600">A revision request becomes stale after seven days without a linked resubmission.</p>
    <Link className="text-sm text-violet-700 underline" href="/nuru/tandem-candidates">Open candidate review queue{needsReview ? ` (${needsReview} need review)` : ""}</Link>
  </main>;
}
