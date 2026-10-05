"use client";

import { FormEvent, useState } from "react";

type Receipt = {
  candidateId: string;
  curationProposalId: string;
  status: "QUEUED_FOR_HUMAN_REVIEW";
  canonicalKnowledgeEffect: "NONE";
};

function requestId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function TandemParticipantCandidateSubmission() {
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError(null);

    const fields = new FormData(form);
    const now = new Date().toISOString();
    const candidateId = requestId("participant-candidate");
    const correlationId = requestId("participant-intake");
    const entities = String(fields.get("entities") ?? "")
      .split(",")
      .map((entity) => entity.trim())
      .filter(Boolean);

    const candidate = {
      candidateId,
      missionId: String(fields.get("missionId") ?? "").trim(),
      originatingSystem: "tandem-participant-portal",
      originatingAgent: "workspace-participant",
      subject: String(fields.get("subject") ?? "").trim(),
      proposedClaims: [{
        text: String(fields.get("claim") ?? "").trim(),
        confidence: Number(fields.get("confidence") ?? "0.5"),
      }],
      entities,
      evidence: [{
        referenceId: String(fields.get("evidenceReference") ?? "").trim(),
        detail: String(fields.get("evidenceDetail") ?? "").trim(),
      }],
      sources: [{
        sourceType: "HUMAN_INPUT",
        origin: "Workspace participant submission",
        authority: "LOW",
        createdAt: now,
        retrievedAt: now,
      }],
      eventTime: now,
      observedAt: now,
      significance: "LOW",
      reasonForPreservation: String(fields.get("reasonForPreservation") ?? "").trim(),
      provenance: { missionContextPackageIds: [], correlationId },
    };

    try {
      const response = await fetch("/api/tandem/knowledge-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate),
      });
      const payload = (await response.json()) as { ok?: boolean; data?: Receipt; error?: { message?: string } };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Candidate submission failed.");
      }
      setReceipt(payload.data);
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Candidate submission failed.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="rounded border border-violet-300/40 bg-slate-950/20 p-5" aria-labelledby="participant-intake-title">
    <p className="text-xs font-medium uppercase tracking-wide text-violet-300">Tandem participant intake</p>
    <h1 id="participant-intake-title" className="mt-1 text-2xl font-semibold">Propose evidence for governed review</h1>
    <p className="mt-2 text-sm text-slate-300">Your submission becomes a review candidate only. It cannot create or change canonical Nuru knowledge. Do not submit credentials, private keys, or other secrets.</p>

    <form className="mt-5 grid gap-4" onSubmit={(event) => void submit(event)}>
      <label className="grid gap-1 text-sm font-medium">Mission identifier
        <input name="missionId" required minLength={1} maxLength={120} defaultValue="participant-intake" className="rounded border border-slate-500 bg-slate-950 px-3 py-2 text-white" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Topic or subject
        <input name="subject" required minLength={1} maxLength={500} className="rounded border border-slate-500 bg-slate-950 px-3 py-2 text-white" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Proposed claim
        <textarea name="claim" required minLength={10} maxLength={4000} rows={4} className="rounded border border-slate-500 bg-slate-950 px-3 py-2 text-white" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Evidence reference
        <input name="evidenceReference" required minLength={1} maxLength={300} placeholder="A URL, report title, or other retrievable reference" className="rounded border border-slate-500 bg-slate-950 px-3 py-2 text-white" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Evidence note
        <textarea name="evidenceDetail" required minLength={3} maxLength={2000} rows={3} className="rounded border border-slate-500 bg-slate-950 px-3 py-2 text-white" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Related entities <span className="font-normal text-slate-400">(optional, comma-separated)</span>
        <input name="entities" maxLength={2000} className="rounded border border-slate-500 bg-slate-950 px-3 py-2 text-white" />
      </label>
      <label className="grid gap-1 text-sm font-medium">Your confidence
        <select name="confidence" defaultValue="0.5" className="rounded border border-slate-500 bg-slate-950 px-3 py-2 text-white">
          <option value="0.25">Low (0.25)</option>
          <option value="0.5">Moderate (0.50)</option>
          <option value="0.75">High (0.75)</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">Why preserve this for review?
        <textarea name="reasonForPreservation" required minLength={10} maxLength={2000} rows={3} className="rounded border border-slate-500 bg-slate-950 px-3 py-2 text-white" />
      </label>
      <button type="submit" disabled={busy || Boolean(receipt)} className="w-fit rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? "Submitting candidate…" : receipt ? "Candidate submitted" : "Submit for governor review"}
      </button>
    </form>

    {receipt ? <p className="mt-4 text-sm text-emerald-200">Receipt {receipt.candidateId} is {receipt.status.replaceAll("_", " ")} · canonical effect: {receipt.canonicalKnowledgeEffect} · proposal {receipt.curationProposalId}.</p> : null}
    {error ? <p className="mt-4 text-sm text-rose-200" role="alert">{error}</p> : null}
  </section>;
}
