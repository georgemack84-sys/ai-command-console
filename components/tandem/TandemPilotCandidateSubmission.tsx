"use client";

import { useState } from "react";

type Receipt = {
  candidateId: string;
  curationProposalId: string;
  status: "QUEUED_FOR_HUMAN_REVIEW";
  canonicalKnowledgeEffect: "NONE";
};

const pilotCandidate = {
  candidateId: "pilot-tandem-intake-2026-09-27",
  missionId: "pilot-qualification",
  originatingSystem: "tandem-pilot",
  originatingAgent: "nuru-qualification",
  subject: "Nuru × Tandem federation intake qualification",
  proposedClaims: [
    {
      text: "This controlled pilot verifies that a Tandem candidate is preserved for human review without creating canonical knowledge.",
      confidence: 1,
    },
  ],
  entities: ["nuru", "tandem", "pilot-qualification"],
  evidence: [
    {
      referenceId: "pilot-evidence-2026-09-27",
      detail: "Synthetic controlled qualification evidence; not a factual production claim.",
    },
  ],
  sources: [
    {
      sourceType: "HUMAN_INPUT",
      origin: "Nuru pilot qualification",
      authority: "OWNER",
      createdAt: "2026-09-27T00:00:00.000Z",
      retrievedAt: "2026-09-27T00:00:00.000Z",
    },
  ],
  eventTime: "2026-09-27T00:00:00.000Z",
  observedAt: "2026-09-27T00:00:00.000Z",
  significance: "LOW",
  reasonForPreservation: "Controlled end-to-end qualification of the governed Tandem intake boundary.",
  provenance: {
    missionContextPackageIds: [],
    correlationId: "pilot-qualification-2026-09-27",
  },
};

export function TandemPilotCandidateSubmission() {
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/tandem/knowledge-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pilotCandidate),
      });
      const payload = (await response.json()) as { ok?: boolean; data?: Receipt; error?: { message?: string } };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Pilot candidate submission failed.");
      }
      setReceipt(payload.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pilot candidate submission failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded border border-violet-300/30 bg-violet-950/20 p-4" aria-labelledby="pilot-candidate-title">
      <p className="text-xs font-medium uppercase tracking-wide text-violet-300">Controlled qualification</p>
      <h2 id="pilot-candidate-title" className="mt-1 font-medium">Tandem intake pilot</h2>
      <p className="mt-2 text-sm text-slate-300">
        Submit one synthetic, low-significance candidate to verify receipt, human-review gating, and audit signing. It cannot create canonical knowledge.
      </p>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || Boolean(receipt)}
        className="mt-3 rounded bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Submitting pilot candidate…" : receipt ? "Pilot candidate submitted" : "Submit pilot candidate"}
      </button>
      {receipt ? (
        <p className="mt-3 text-sm text-emerald-200">
          Receipt {receipt.candidateId} is {receipt.status.replaceAll("_", " ")} · canonical effect: {receipt.canonicalKnowledgeEffect} · proposal {receipt.curationProposalId}.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
    </section>
  );
}
