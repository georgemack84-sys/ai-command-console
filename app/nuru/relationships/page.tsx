"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock3, History, Network, RotateCcw, ShieldCheck, X } from "lucide-react";
import "../nuru.css";

type KnowledgeNode = { id: string; title: string; contentType: string; project: string | null; confidence: number; status: string };
type Relationship = { id: string; sourceItemId: string; targetItemId: string; relationshipType: string; confidence: number; status: string };
type PendingReview = Relationship & { evidence: string; proposedBy: string; sourceTitle: string; targetTitle: string };
type RelationshipAudit = { id: string; eventType: string; actor: string; decision: string | null; reason: string | null; createdAt: string };
type HistoricalRelationship = PendingReview & { createdAt: string; auditTrail: RelationshipAudit[] };
type Decision = "APPROVE" | "REJECT" | "HOLD" | "REVOKE";

function readableRelationship(type: string) { return type.replaceAll("_", " "); }
function readableEvent(event: string) { return event.replace("RELATIONSHIP_", "").replaceAll("_", " "); }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export default function NuruRelationshipsPage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [selected, setSelected] = useState<KnowledgeNode | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [history, setHistory] = useState<HistoricalRelationship[]>([]);
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  async function load() {
    const [knowledgeResponse, reviewResponse] = await Promise.all([
      fetch("/api/nuru/knowledge?status=APPROVED,ARCHIVED,SUPERSEDED&limit=100", { cache: "no-store" }),
      fetch("/api/nuru/relationships", { cache: "no-store" }),
    ]);
    const knowledgeBody = await knowledgeResponse.json() as { data?: KnowledgeNode[] };
    const reviewBody = await reviewResponse.json() as { data?: PendingReview[] };
    const nextNodes = knowledgeBody.data ?? [];
    setNodes(nextNodes);
    setSelected((current) => current ?? nextNodes[0] ?? null);
    setPending(reviewBody.data ?? []);
  }

  async function loadSelected(itemId: string) {
    const [approvedResponse, historyResponse] = await Promise.all([
      fetch(`/api/nuru/knowledge/${itemId}/relationships`, { cache: "no-store" }),
      fetch(`/api/nuru/relationships/history/${itemId}`, { cache: "no-store" }),
    ]);
    const approvedBody = await approvedResponse.json() as { data?: Relationship[] };
    const historyBody = await historyResponse.json() as { data?: HistoricalRelationship[] };
    setRelationships(approvedBody.data?.filter((relationship) => relationship.status === "APPROVED") ?? []);
    setHistory(historyBody.data ?? []);
  }

  useEffect(() => { void Promise.resolve().then(load).catch(() => setMessage("Unable to load relationship governance.")); }, []);
  useEffect(() => {
    if (!selected) return;
    void loadSelected(selected.id).catch(() => { setRelationships([]); setHistory([]); });
  }, [selected]);

  async function decide(review: PendingReview | HistoricalRelationship, decision: Decision) {
    setDecidingId(review.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/nuru/relationships/${review.id}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, reason: reason[review.id]?.trim() || (decision === "REVOKE" ? "Human governor revoked this relationship because it is not an appropriate Discover path." : "Human governor reviewed the relationship evidence.") }),
      });
      const body = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Unable to record the relationship decision.");
      setMessage(decision === "APPROVE" ? "Relationship approved and recorded in the graph." : decision === "REJECT" ? "Relationship rejected; no path was created." : decision === "REVOKE" ? "Relationship revoked and removed from Discover paths. Its decision history remains preserved." : "Relationship remains pending on hold.");
      if (decision !== "HOLD") await Promise.all([load(), selected ? loadSelected(selected.id) : Promise.resolve()]);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to record the relationship decision.");
    } finally {
      setDecidingId(null);
    }
  }

  const connectedTitle = (relationship: Relationship) => nodes.find((node) => node.id === (relationship.sourceItemId === selected?.id ? relationship.targetItemId : relationship.sourceItemId))?.title ?? "Historical or external record";

  return <main className="nuru-shell relationship-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/discover">Discover</Link><Link href="/nuru/review">Knowledge review</Link><Link className="active" href="/nuru/relationships">Relationships</Link></nav></header>
    <section className="relationship-hero"><p className="eyebrow"><Network size={16} /> Human graph governance</p><h1>Relationship Review</h1><p>Proposed edges are not paths. A human governor must record a decision before Discover can use a relationship.</p></section>
    <section className="relationship-review"><div className="relationship-review-heading"><div><p className="eyebrow"><ShieldCheck size={16} /> Pending decisions</p><h2>{pending.length ? `${pending.length} relationship${pending.length === 1 ? "" : "s"} awaiting review` : "Relationship queue is clear"}</h2></div><span><Clock3 size={15} /> Human authority required</span></div>{pending.length === 0 ? <p className="relationship-empty">New relationship proposals will appear here. Topic overlap alone never creates a path.</p> : pending.map((review) => <article className="relationship-review-card" key={review.id}><div><p className="eyebrow">Proposed {readableRelationship(review.relationshipType)}</p><h3>{review.sourceTitle} <span>→</span> {review.targetTitle}</h3><p><b>{Math.round(review.confidence * 100)}% confidence</b> · proposed by {review.proposedBy}</p><p className="relationship-evidence">{review.evidence}</p></div><label>Decision rationale<textarea value={reason[review.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [review.id]: event.target.value }))} placeholder="Why should this relationship be approved, rejected, or held?" /></label><div className="relationship-actions"><button type="button" className="quiet-button" disabled={decidingId !== null} onClick={() => void decide(review, "REJECT")}><X size={15} /> Reject</button><button type="button" className="quiet-button" disabled={decidingId !== null} onClick={() => void decide(review, "HOLD")}>Hold</button><button type="button" className="gold-button" disabled={decidingId !== null} onClick={() => void decide(review, "APPROVE")}><Check size={15} /> {decidingId === review.id ? "Recording…" : "Approve"}</button></div></article>)}{message && <p className="relationship-message" role="status">{message}</p>}</section>
    <section className="relationship-graph"><div><p className="eyebrow">Approved graph</p><h2>Relationship View</h2><p>Only approved graph relationships appear in this view. The audit history below also retains rejected and revoked edges.</p></div><div className="relationship-layout"><div className="relationship-nodes">{nodes.map((node) => <button key={node.id} type="button" onClick={() => setSelected(node)} className={selected?.id === node.id ? "selected" : ""}>{node.title}</button>)}</div><aside><p className="eyebrow">Selected node</p>{selected ? <><h2>{selected.title}</h2><p>{selected.contentType}</p><p><b>Project:</b> {selected.project ?? "Unscoped"}</p><p><b>Confidence:</b> {Math.round(selected.confidence * 100)}%</p><p><b>Status:</b> {selected.status}</p><p><b>Approved relationships:</b> {relationships.length}</p>{relationships.length ? <ul>{relationships.map((relationship) => <li key={relationship.id}>{readableRelationship(relationship.relationshipType)} → {connectedTitle(relationship)} · {Math.round(relationship.confidence * 100)}%</li>)}</ul> : <p>No approved graph relationships yet.</p>}</> : <p>No knowledge nodes available.</p>}</aside></div>
      <div className="relationship-history"><div><p className="eyebrow"><History size={16} /> Decision history</p><h2>{selected ? `Every graph decision involving ${selected.title}` : "Select a knowledge record"}</h2><p>Rejected and revoked edges are retained as an auditable record, but never appear in Discover traversal.</p></div>{history.length ? <div className="relationship-history-list">{history.map((relationship) => <article key={relationship.id}><header><div><p className="eyebrow">{relationship.status}</p><h3>{relationship.sourceTitle} <span>→</span> {relationship.targetTitle}</h3><p>{readableRelationship(relationship.relationshipType)} · {Math.round(relationship.confidence * 100)}% confidence · proposed by {relationship.proposedBy}</p></div>{relationship.status === "APPROVED" && <button type="button" className="quiet-button" disabled={decidingId !== null} onClick={() => void decide(relationship, "REVOKE")}><RotateCcw size={15} /> {decidingId === relationship.id ? "Recording…" : "Revoke edge"}</button>}</header><p className="relationship-evidence">{relationship.evidence}</p><ol>{relationship.auditTrail.map((audit) => <li key={audit.id}><b>{audit.decision ?? readableEvent(audit.eventType)}</b><span>{audit.actor} · {formatDate(audit.createdAt)}</span>{audit.reason && <small>{audit.reason}</small>}</li>)}</ol>{relationship.status === "APPROVED" && <label>Revocation rationale<textarea value={reason[relationship.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [relationship.id]: event.target.value }))} placeholder="Why should this approved path be revoked?" /></label>}</article>)}</div> : <p className="relationship-empty">No graph decisions involve this record yet.</p>}</div>
    </section>
  </main>;
}
