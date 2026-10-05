"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type KnowledgeItem = { id: string; title: string; status: string; project: string | null };
type Review = { id: string; currentItemId: string; candidateItemId: string; status: string; reason: string; requestedBy: string; decidedBy: string | null; decisionReason: string | null; narrowedScope: string | null; createdAt: string; decidedAt: string | null };
type ApiResponse<T> = { ok: boolean; data?: T; error?: { message?: string } };

const field = { width: "100%", padding: 10, background: "#101616", color: "#f3eadb", border: "1px solid rgba(225,202,158,.32)" };
const canonicalStatuses = "APPROVED,ARCHIVED";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json() as ApiResponse<T>;
  if (!response.ok || !body.ok || body.data === undefined) throw new Error(body.error?.message ?? "Nuru could not complete this governance action.");
  return body.data;
}

export default function SupersessionPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentItemId, setCurrentItemId] = useState("");
  const [candidateItemId, setCandidateItemId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const names = useMemo(() => new Map(items.map((item) => [item.id, item.title])), [items]);
  const load = () => void Promise.all([
    request<KnowledgeItem[]>(`/api/nuru/knowledge?status=${canonicalStatuses}`),
    request<Review[]>("/api/nuru/curation/supersession"),
  ]).then(([knowledge, existingReviews]) => {
    setItems(knowledge);
    setReviews(existingReviews);
    setCurrentItemId((current) => current || knowledge[0]?.id || "");
    setCandidateItemId((current) => current || knowledge[1]?.id || "");
  }).catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : "Unable to load supersession governance."));

  useEffect(load, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await request<Review>("/api/nuru/curation/supersession", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentItemId, candidateItemId, reason }) });
      setReason("");
      setMessage("Supersession review created. No knowledge was changed.");
      load();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Unable to create the review."); }
  }

  async function decide(review: Review, action: "REJECT" | "COEXIST" | "NARROW_SCOPE" | "SUPERSEDE") {
    // The action button is the human decision. Reuse the review's recorded rationale
    // so governance remains auditable without depending on a browser prompt.
    const decisionReason = `${review.reason} Human governor recorded ${action.toLowerCase().replaceAll("_", " ")}.`;
    const narrowedScope = action === "NARROW_SCOPE" ? window.prompt("Narrowed scope:") : undefined;
    if (action === "NARROW_SCOPE" && !narrowedScope?.trim()) return;
    try {
      await request(`/api/nuru/curation/supersession/${review.id}/decision`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, reason: decisionReason, ...(narrowedScope ? { narrowedScope } : {}) }) });
      setMessage(action === "SUPERSEDE" ? "Supersession approved; both records and their history were preserved." : `Review recorded: ${action.replaceAll("_", " ")}.`);
      load();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Unable to record the decision."); }
  }

  const pending = reviews.filter((review) => review.status === "PENDING");
  return <main className="nuru-shell"><section style={{ maxWidth: 1120, margin: "auto", padding: "55px 0" }}>
    <p className="eyebrow">Nuru / Governance</p><h1 style={{ fontFamily: "'DM Serif Display'", fontSize: 54 }}>Supersession Review</h1>
    <p>Contradictory or evolving knowledge must be resolved by a human. Nuru never chooses a successor on its own.</p>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, marginTop: 26 }}>
      <form onSubmit={submit} style={{ padding: 22, border: "1px solid rgba(225,202,158,.32)" }}><p className="eyebrow">Create review</p><h2>Compare two durable records</h2><label>Current record<select value={currentItemId} onChange={(event) => setCurrentItemId(event.target.value)} style={field}>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Candidate successor<select value={candidateItemId} onChange={(event) => setCandidateItemId(event.target.value)} style={field}>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Why does this require review?<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} required style={{ ...field, minHeight: 120 }} placeholder="Describe the conflict, change, or overlap." /></label><button className="gold-button" disabled={!currentItemId || !candidateItemId || currentItemId === candidateItemId || reason.trim().length < 3} type="submit">Request supersession review</button></form>
      <div><p className="eyebrow">Human decisions</p>{pending.length ? pending.map((review) => <article key={review.id} style={{ padding: 22, border: "1px solid rgba(225,202,158,.32)", marginBottom: 16 }}><small>PENDING REVIEW</small><h2>{names.get(review.currentItemId) ?? review.currentItemId}</h2><p>Potential successor: <b>{names.get(review.candidateItemId) ?? review.candidateItemId}</b></p><p>{review.reason}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><button className="quiet-button" onClick={() => void decide(review, "REJECT")}>Reject</button><button className="quiet-button" onClick={() => void decide(review, "COEXIST")}>Coexist</button><button className="quiet-button" onClick={() => void decide(review, "NARROW_SCOPE")}>Narrow scope</button><button className="gold-button" onClick={() => void decide(review, "SUPERSEDE")}>Supersede</button></div></article>) : <p>No supersession reviews are awaiting human authority.</p>}</div>
    </div>
    {reviews.filter((review) => review.status !== "PENDING").length > 0 && <section style={{ marginTop: 30 }}><p className="eyebrow">History</p>{reviews.filter((review) => review.status !== "PENDING").map((review) => <p key={review.id}><b>{review.status.replaceAll("_", " ")}</b> · {names.get(review.currentItemId) ?? review.currentItemId} → {names.get(review.candidateItemId) ?? review.candidateItemId}</p>)}</section>}
    {message && <div className="toast" role="status">{message}<button onClick={() => setMessage(null)} aria-label="Dismiss message">×</button></div>}
  </section></main>;
}
