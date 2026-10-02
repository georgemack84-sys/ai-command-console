"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, ShieldCheck } from "lucide-react";
import "../../nuru.css";

type Step = { knowledgeItemId: string; title: string; summary: string; contentType: string; confidence: number };
type Path = { id: string; steps: Step[]; relationship: { type: string; confidence: number; evidence: string }; explanation: string };
type Candidate = { id: string; steps: Step[]; sharedTopics: string[]; pendingRelationshipType?: string; explanation: string };
type Branch = { id: string; source: Step; options: Array<{ id: string; target: Step; relationship: { type: string; confidence: number; evidence: string }; explanation: string }> };
type PathReadiness = { paths: Path[]; branches: Branch[]; candidates: Candidate[] };
const pathProgressKey = "nuru-discover-path-progress-v1";

export default function NuruDiscoverPathsPage() {
  const [readiness, setReadiness] = useState<PathReadiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposingId, setProposingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [proposalMessage, setProposalMessage] = useState<string | null>(null);
  const [pathProgress, setPathProgress] = useState<Record<string, string[]>>({});
  useEffect(() => {
    void fetch("/api/nuru/discover/paths", { cache: "no-store" }).then(async (response) => {
      const body = await response.json() as { ok: boolean; data?: PathReadiness; error?: { message?: string } };
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to load governed paths.");
      setReadiness(body.data);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load governed paths."));
  }, []);
  useEffect(() => {
    queueMicrotask(() => {
      try { setPathProgress(JSON.parse(window.localStorage.getItem(pathProgressKey) ?? "{}") as Record<string, string[]>); } catch { /* Progress is optional and private to this browser. */ }
    });
  }, []);
  function savePathProgress(pathId: string, completedSteps: string[]) {
    setPathProgress((current) => {
      const next = { ...current, [pathId]: completedSteps };
      try { window.localStorage.setItem(pathProgressKey, JSON.stringify(next)); } catch { /* Progress remains available for this session. */ }
      return next;
    });
  }
  async function proposeCandidate(candidate: Candidate) {
    setProposingId(candidate.id); setProposalMessage(null);
    try {
      const response = await fetch("/api/nuru/relationships", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceItemId: candidate.steps[0].knowledgeItemId, targetItemId: candidate.steps[1].knowledgeItemId, relationshipType: "RELATED_TO", confidence: Math.min(0.9, 0.7 + candidate.sharedTopics.length * 0.1), evidence: `Both human-admitted Discover records share the topics ${candidate.sharedTopics.join(", ")}. A governor requested relationship review before this becomes a guided path.` }) });
      const body = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Unable to create the relationship proposal.");
      setProposalMessage("Relationship proposal recorded. It remains pending until a human governor approves it.");
    } catch (cause) { setProposalMessage(cause instanceof Error ? cause.message : "Unable to create the relationship proposal."); }
    finally { setProposingId(null); }
  }
  async function approveCandidate(candidate: Candidate) {
    if (!candidate.pendingRelationshipType) return;
    setApprovingId(candidate.id); setProposalMessage(null);
    try {
      const response = await fetch("/api/nuru/relationships/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceItemId: candidate.steps[0].knowledgeItemId, targetItemId: candidate.steps[1].knowledgeItemId, relationshipType: candidate.pendingRelationshipType, reason: "Approved by the human governor for a governed Discover path." }) });
      const body = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Unable to record the relationship approval.");
      setProposalMessage("Relationship approved. Reloading the governed path…");
      const refreshed = await fetch("/api/nuru/discover/paths", { cache: "no-store" });
      const refreshedBody = await refreshed.json() as { ok: boolean; data?: PathReadiness };
      if (refreshed.ok && refreshedBody.ok && refreshedBody.data) setReadiness(refreshedBody.data);
    } catch (cause) { setProposalMessage(cause instanceof Error ? cause.message : "Unable to record the relationship approval."); }
    finally { setApprovingId(null); }
  }
  return <main className="nuru-shell paths-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/discover">Discover</Link><Link href="/nuru/discover/saved">Saved</Link><Link href="/nuru/discover/taste-map">Taste Map</Link><Link className="active" href="/nuru/discover/paths">Go deeper</Link></nav></header>
    <section className="paths-hero"><Link className="back-link" href="/nuru/discover"><ArrowLeft size={16} /> Back to Discover</Link><p className="eyebrow"><Compass size={16} /> Explainable exploration</p><h1>Go deeper</h1><p>Follow only relationships that have been approved in Nuru’s knowledge graph. Each connection remains visible, bounded, and inspectable.</p></section>
    <section className="paths-content">{error && <p role="alert">{error}</p>}{readiness === null && !error && <p>Tracing approved knowledge paths…</p>}{readiness?.branches.length ? <section className="path-branches" aria-labelledby="branch-title"><p className="eyebrow">Governed next steps</p><h2 id="branch-title">Choose where to go deeper</h2><p>Every option comes from a directed, human-approved graph relationship. Nuru does not infer these choices from topic similarity.</p>{readiness.branches.map((branch) => <article key={branch.id}><header><p className="eyebrow">From</p><h3>{branch.source.title}</h3><Link href={"/nuru/discover/" + branch.source.knowledgeItemId}>Inspect starting point <ArrowRight size={14} /></Link></header><div>{branch.options.map((option) => <Link className="branch-option" key={option.id} href={"/nuru/discover/paths/" + option.id}><span><b>{option.target.title}</b><small>{option.explanation}</small></span><em>{option.relationship.type.replaceAll("_", " ")} · {Math.round(option.relationship.confidence * 100)}%</em><ArrowRight size={17} /></Link>)}</div></article>)}</section> : null}{readiness?.paths.map((path) => { const started = path.id in pathProgress; const completed = pathProgress[path.id] ?? []; const nextStep = path.steps.find((step) => !completed.includes(step.knowledgeItemId)); return <article className="path-card" key={path.id}><div className="path-steps">{path.steps.map((step, index) => <div key={step.knowledgeItemId}><Link href={"/nuru/discover/" + step.knowledgeItemId}><p className="eyebrow">Step {index + 1}</p><h2>{step.title}</h2><p>{step.summary}</p></Link><button type="button" className="path-step-toggle" disabled={!started} onClick={() => savePathProgress(path.id, completed.includes(step.knowledgeItemId) ? completed.filter((id) => id !== step.knowledgeItemId) : [...completed, step.knowledgeItemId])}>{completed.includes(step.knowledgeItemId) ? "Explored ✓" : "Mark explored"}</button>{index < path.steps.length - 1 && <span className="path-connector"><ArrowRight size={18} /> {path.relationship.type.replaceAll("_", " ")} · {Math.round(path.relationship.confidence * 100)}%</span>}</div>)}</div><aside><p className="eyebrow">Why this path</p><p>{path.explanation}</p><small>{path.relationship.evidence.replaceAll("_", " ")} relationship</small><div className="path-progress"><b>{completed.length}/{path.steps.length} stops explored</b>{!started ? <button type="button" className="gold-button" onClick={() => savePathProgress(path.id, [])}>Start path</button> : nextStep ? <Link className="quiet-button" href={"/nuru/discover/" + nextStep.knowledgeItemId}>Continue: {nextStep.title} <ArrowRight size={14} /></Link> : <><span>Path complete</span><button type="button" className="quiet-button" onClick={() => savePathProgress(path.id, [])}>Reset progress</button></>}</div></aside></article>; })}{readiness?.paths.length === 0 && <div className="paths-empty"><ShieldCheck size={30} /><h2>Your next governed path is waiting.</h2><p>A path needs a human-approved relationship between two admitted records. Nuru will not convert a topical similarity into a relationship on its own.</p><Link className="gold-button" href="/nuru/relationships">View relationships <ArrowRight size={16} /></Link></div>}{readiness?.candidates.length ? <section className="path-candidates" aria-labelledby="candidate-title"><p className="eyebrow">Relationship review cues</p><h2 id="candidate-title">Potential next paths</h2><p>These pairs share admitted catalog topics. They are not paths yet and do not affect recommendations until a human approves a graph relationship.</p><div>{readiness.candidates.map((candidate) => <article key={candidate.id}><p className="eyebrow">{candidate.pendingRelationshipType ? "Pending your approval" : "Awaiting approval"}</p><h3>{candidate.steps[0].title} <ArrowRight size={15} /> {candidate.steps[1].title}</h3><p><b>Shared topics:</b> {candidate.sharedTopics.join(", ")}</p><small>{candidate.explanation}</small>{candidate.pendingRelationshipType ? <button type="button" className="gold-button" disabled={approvingId !== null} onClick={() => void approveCandidate(candidate)}>{approvingId === candidate.id ? "Approving…" : "Approve relationship"}</button> : <button type="button" className="quiet-button" disabled={proposingId !== null} onClick={() => void proposeCandidate(candidate)}>{proposingId === candidate.id ? "Recording proposal…" : "Propose relationship"}</button>}</article>)}</div>{proposalMessage && <p className="path-proposal-message" role="status">{proposalMessage}</p>}</section> : null}</section>
  </main>;
}
