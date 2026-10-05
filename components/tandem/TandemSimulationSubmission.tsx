"use client";

import { useState } from "react";

type Receipt = {
  candidateId: string;
  curationProposalId: string;
  status: "QUEUED_FOR_HUMAN_REVIEW";
  canonicalKnowledgeEffect: "NONE";
};

const simulatedCandidate = {
  candidateId: "simulated-tandem-participant-2026-09-28",
  missionId: "simulated-participant-qualification",
  originatingSystem: "tandem-simulation",
  originatingAgent: "simulated-participant",
  subject: "Simulated participant intake validation",
  proposedClaims: [
    {
      text: "This synthetic participant-submitted candidate exists solely to validate the governed Tandem intake workflow.",
      confidence: 0,
    },
  ],
  entities: ["nuru", "tandem", "simulated-participant"],
  evidence: [
    {
      referenceId: "simulated-participant-evidence-2026-09-28",
      detail: "Synthetic test evidence; not a factual production claim.",
    },
  ],
  sources: [
    {
      sourceType: "HUMAN_INPUT",
      origin: "Simulated Tandem participant test fixture",
      authority: "LOW",
      createdAt: "2026-09-28T00:00:00.000Z",
      retrievedAt: "2026-09-28T00:00:00.000Z",
    },
  ],
  eventTime: "2026-09-28T00:00:00.000Z",
  observedAt: "2026-09-28T00:00:00.000Z",
  significance: "LOW",
  reasonForPreservation: "Controlled simulation of a participant-originated Tandem candidate.",
  provenance: {
    missionContextPackageIds: [],
    correlationId: "simulated-participant-qualification-2026-09-28",
  },
};

export function TandemSimulationSubmission() {
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
        body: JSON.stringify(simulatedCandidate),
      });
      const payload = (await response.json()) as { ok?: boolean; data?: Receipt; error?: { message?: string } };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Simulated candidate submission failed.");
      }
      setReceipt(payload.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Simulated candidate submission failed.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="rounded border border-amber-300/40 bg-amber-950/20 p-4" aria-labelledby="simulation-intake-title">
    <p className="text-xs font-medium uppercase tracking-wide text-amber-300">Simulation only</p>
    <h1 id="simulation-intake-title" className="mt-1 text-2xl font-semibold">Tandem participant intake validation</h1>
    <p className="mt-2 text-sm text-slate-300">Submit one synthetic, low-significance candidate. It always requires human review and cannot create canonical knowledge.</p>
    <button type="button" onClick={() => void submit()} disabled={busy || Boolean(receipt)} className="mt-3 rounded bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60">
      {busy ? "Submitting simulated candidate…" : receipt ? "Simulated candidate submitted" : "Submit simulated candidate"}
    </button>
    {receipt ? <p className="mt-3 text-sm text-emerald-200">Receipt {receipt.candidateId} is {receipt.status.replaceAll("_", " ")} · canonical effect: {receipt.canonicalKnowledgeEffect} · proposal {receipt.curationProposalId}.</p> : null}
    {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
  </section>;
}
