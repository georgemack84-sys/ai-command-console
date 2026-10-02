"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Decision = "approve" | "reject" | "hold" | "request-changes";

export function TandemCandidateDecisionControls({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function decide(action: Decision) {
    if (reason.trim().length < 3) {
      setMessage("Record a decision reason of at least three characters.");
      return;
    }

    setBusy(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/nuru/curation/proposals/${proposalId}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json() as { ok?: boolean; error?: { message?: string } };
      if (!response.ok || !result.ok) throw new Error(result.error?.message ?? "Unable to record the governance decision.");
      setMessage(action === "approve" ? "Approved and admitted as canonical Nuru knowledge." : "Governance decision recorded.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to record the governance decision.");
    } finally {
      setBusy(null);
    }
  }

  return <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
    <label className="block text-sm font-medium">Decision reason<textarea className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required governance rationale" rows={2} /></label>
    <div className="flex flex-wrap gap-2">
      <button className="rounded bg-violet-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={busy !== null} onClick={() => void decide("approve")}>{busy === "approve" ? "Approving…" : "Approve"}</button>
      <button className="rounded border px-3 py-2 text-sm disabled:opacity-50" disabled={busy !== null} onClick={() => void decide("request-changes")}>{busy === "request-changes" ? "Requesting…" : "Request revision"}</button>
      <button className="rounded border px-3 py-2 text-sm disabled:opacity-50" disabled={busy !== null} onClick={() => void decide("hold")}>{busy === "hold" ? "Holding…" : "Hold"}</button>
      <button className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50" disabled={busy !== null} onClick={() => void decide("reject")}>{busy === "reject" ? "Rejecting…" : "Reject"}</button>
    </div>
    {message && <p className="text-sm text-slate-600" role="status">{message}</p>}
  </div>;
}
