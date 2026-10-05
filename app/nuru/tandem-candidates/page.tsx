import Link from "next/link";
import { TandemCandidateDecisionControls } from "@/components/tandem/TandemCandidateDecisionControls";
import { requireNuruGovernorPage } from "@/src/server/api/nuru-api";
import { nuruTandemKnowledgeIntakeService } from "@/src/server/services/nuru-tandem-knowledge-intake-service";

export const dynamic = "force-dynamic";

export default async function TandemCandidateReviewPage() {
  const user = await requireNuruGovernorPage("/nuru/tandem-candidates");
  const entries = await nuruTandemKnowledgeIntakeService.list(user.workspaceId);

  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <header>
      <p className="text-sm font-medium uppercase tracking-wide text-violet-700">Nuru · Tandem Intake</p>
      <h1 className="text-2xl font-semibold">Knowledge candidate review queue</h1>
      <p className="mt-1 text-sm text-slate-600">Tandem may propose evidence for curation. Nothing in this queue is canonical knowledge until a governor approves it.</p>
    </header>
    <section className="rounded border p-4">
      <h2 className="font-medium">Pending and reviewed receipts</h2>
      {entries.length ? <ul className="mt-3 space-y-3">{entries.map(({ receipt, proposal, lifecycle, canonicalKnowledgeEffect }) => <li key={receipt.id} className="rounded border border-slate-200 p-3">
        <div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{receipt.payload.subject}</p><span className="font-mono text-xs">{proposal?.status ?? "PROPOSAL_UNAVAILABLE"}</span></div>
        <p className="mt-1 text-sm text-slate-600">Mission {receipt.missionId} · {receipt.payload.originatingSystem} · {receipt.payload.proposedClaims.length} proposed claim(s)</p>
        <p className="mt-1 text-sm">Proposal {receipt.curationProposalId} · recommendation {proposal?.recommendation ?? "unavailable"}</p>
        <p className="mt-1 text-xs text-slate-500">{canonicalKnowledgeEffect} · required review {String(proposal?.requiredReview ?? true)}</p>
        <Link className="mt-2 inline-block text-sm text-violet-700 underline" href={`/nuru/tandem-audit-verifier?candidateId=${encodeURIComponent(receipt.candidateId)}`}>Open and verify audit record</Link>
        <section className="mt-3 rounded bg-slate-50 p-3" aria-label="Candidate lifecycle"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lifecycle</p><ol className="mt-2 space-y-1 text-sm text-slate-600">{lifecycle.map((step, index) => <li key={step.candidateId}><span className="font-medium text-slate-800">{index === 0 ? "Original submission" : "Revision submitted"}</span> · {step.status.replaceAll("_", " ")} · {step.receivedAt.toLocaleString()}{step.revisionOfCandidateId ? ` · revises ${step.revisionOfCandidateId}` : ""}</li>)}</ol></section>
        {proposal?.status === "HUMAN_REVIEW_REQUIRED" && <TandemCandidateDecisionControls proposalId={receipt.curationProposalId} />}
      </li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No Tandem knowledge candidates have been received.</p>}
    </section>
    <div className="flex gap-4"><Link className="text-sm text-violet-700 underline" href="/nuru/tandem-operations">Back to Tandem operations</Link><Link className="text-sm text-violet-700 underline" href="/nuru/tandem-audit-verifier">Verify an audit export</Link></div>
  </main>;
}
