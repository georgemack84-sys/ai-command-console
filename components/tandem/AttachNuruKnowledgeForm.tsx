"use client";

import { useState } from "react";

export function AttachNuruKnowledgeForm({ missionId, initialSubject = "" }: { missionId: string; initialSubject?: string }) {
  const [subject, setSubject] = useState(initialSubject);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    const response = await fetch(`/api/tandem/missions/${encodeURIComponent(missionId)}/knowledge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId: `ui-${crypto.randomUUID()}`, missionId, participantId: "mission-console", participantType: "HUMAN", subject, requestedContext: ["MISSION", "BRIEFING"], freshnessRequirement: "CURRENT", provenanceRequired: true, maxResults: 5 }),
    });
    const body = await response.json() as { ok: boolean; data?: { package?: { knowledge?: unknown[] } }; error?: { message?: string } };
    if (!response.ok || !body.ok) { setState("error"); setMessage(body.error?.message ?? "Unable to attach Nuru knowledge."); return; }
    setState("success");
    setMessage(`Attached a new immutable package with ${body.data?.package?.knowledge?.length ?? 0} traceable knowledge item(s). Refresh this page to view it.`);
    setSubject("");
  }

  return <section className="rounded border p-4"><h2 className="font-medium">Attach Nuru knowledge</h2><p className="mt-1 text-sm text-slate-600">Retrieve governed, provenance-required context and attach it as a new immutable mission snapshot.</p><form className="mt-3 flex flex-wrap gap-2" onSubmit={submit}><label className="sr-only" htmlFor="nuru-subject">Subject</label><input id="nuru-subject" required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Entity or approved alias, e.g. NVDA" className="min-w-64 rounded border px-3 py-2 text-sm" /><button disabled={state === "submitting"} className="rounded bg-violet-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{state === "submitting" ? "Attaching…" : "Retrieve and attach"}</button></form>{message ? <p className={`mt-3 text-sm ${state === "error" ? "text-red-700" : "text-emerald-700"}`}>{message}</p> : null}</section>;
}
