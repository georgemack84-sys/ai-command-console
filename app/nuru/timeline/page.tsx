"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import "../nuru.css";

type Development = { id: string; type: string; eventTime: string; publicationTime: string | null; discoveryTime: string; summary: string; verificationState: string; sourceAuthority: string; claims: Array<{ text: string }>; evidence: Array<{ referenceId: string; kind: string; detail: string }> };
type Claim = { id: string; predicate: string; value: unknown; normalizedValue: string; state: string; effectiveFrom: string; effectiveTo: string | null; assertedAt: string; observedAt: string; evidence: Array<{ referenceId: string; detail: string }> };
type Correction = { id: string; previousClaimId: string; correctedClaimId: string; reason: string; createdAt: string; decision: { action: string; reason: string; createdAt: string } | null };
type Envelope<T> = { ok: boolean; data?: T; error?: { message?: string } };

function readable(value: string) { return value.replaceAll("_", " ").toLowerCase(); }
function when(value: string) { return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value)); }
function displayValue(value: unknown) { return typeof value === "string" ? value : JSON.stringify(value); }

export default function NuruTimelinePage() {
  const [subjectId, setSubjectId] = useState("");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadTimeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = subjectId.trim();
    if (!subject) return;
    setLoading(true); setError(null);
    try {
      const encoded = encodeURIComponent(subject);
      const [developmentResponse, claimResponse] = await Promise.all([
        fetch(`/api/nuru/knowledge-developments?subjectId=${encoded}`, { cache: "no-store" }),
        fetch(`/api/nuru/temporal-claims?subjectId=${encoded}`, { cache: "no-store" }),
      ]);
      const [developmentBody, claimBody] = await Promise.all([
        developmentResponse.json() as Promise<Envelope<{ developments: Development[] }>>,
        claimResponse.json() as Promise<Envelope<{ claims: Claim[]; corrections: Correction[] }>>,
      ]);
      if (!developmentResponse.ok || !developmentBody.ok) throw new Error(developmentBody.error?.message ?? "Nuru could not load this knowledge timeline.");
      if (!claimResponse.ok || !claimBody.ok) throw new Error(claimBody.error?.message ?? "Nuru could not load this claim history.");
      setDevelopments(developmentBody.data?.developments ?? []);
      setClaims(claimBody.data?.claims ?? []);
      setCorrections(claimBody.data?.corrections ?? []);
      setActiveSubject(subject);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nuru could not load this knowledge timeline.");
      setActiveSubject(null);
    } finally { setLoading(false); }
  }

  const claimsById = new Map(claims.map((claim) => [claim.id, claim]));

  return <main className="nuru-shell temporal-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/discover">Discover</Link><Link className="active" href="/nuru/timeline">What changed?</Link><Link href="/nuru/review">Review</Link></nav></header>
    <section className="temporal-hero"><p className="eyebrow"><Clock3 size={16} /> Temporal knowledge</p><h1>What changed?</h1><p>Trace how Nuru’s evidence evolved. This is a knowledge record—not a news feed—and no entry changes canonical knowledge by itself.</p><form onSubmit={(event) => void loadTimeline(event)}><label htmlFor="subject">Subject ID</label><div><input id="subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} placeholder="company:nvidia" aria-describedby="subject-help" /><button className="gold-button" type="submit" disabled={loading}>{loading ? "Loading…" : <><Search size={16} /> View timeline</>}</button></div><small id="subject-help">Use a stable Nuru subject identifier, such as <code>company:nvidia</code>.</small></form></section>
    {error && <section className="temporal-empty" role="alert"><AlertTriangle size={26} /><h2>Timeline unavailable</h2><p>{error}</p></section>}
    {!error && !activeSubject && <section className="temporal-empty"><Clock3 size={28} /><h2>Start with a subject.</h2><p>Nuru will show developments, claims, and corrections in the order they became meaningful.</p></section>}
    {!error && activeSubject && <section className="temporal-content" aria-live="polite"><header><div><p className="eyebrow">Temporal record</p><h2>{activeSubject}</h2></div><span>{developments.length} development{developments.length === 1 ? "" : "s"} · {claims.length} claim{claims.length === 1 ? "" : "s"}</span></header>
      {developments.length === 0 && claims.length === 0 && <div className="temporal-empty"><ShieldCheck size={27} /><h2>No durable changes recorded yet.</h2><p>Nuru has not recorded evidence-backed developments or temporal claims for this subject.</p></div>}
      {developments.length > 0 && <section className="temporal-section"><p className="eyebrow">Developments</p><div className="temporal-rail">{developments.map((development) => <article key={development.id} className="temporal-event"><span className={development.verificationState === "VERIFIED" ? "verified" : ""}><Clock3 size={15} /></span><div><time>{when(development.eventTime)} · {readable(development.type)}</time><h3>{development.summary}</h3><p className="temporal-meta">{readable(development.verificationState)} · {readable(development.sourceAuthority)} authority · learned {when(development.discoveryTime)}</p>{development.claims.length > 0 && <ul>{development.claims.map((claim) => <li key={claim.text}>{claim.text}</li>)}</ul>}<details><summary>Evidence ({development.evidence.length})</summary><ul>{development.evidence.map((evidence) => <li key={`${evidence.referenceId}-${evidence.detail}`}><b>{evidence.kind}</b> · {evidence.detail}</li>)}</ul></details></div></article>)}</div></section>}
      {claims.length > 0 && <section className="temporal-section"><p className="eyebrow">Claim history</p><div className="temporal-claims">{claims.map((claim) => <article key={claim.id}><header><div><small>{claim.predicate}</small><h3>{displayValue(claim.value)}</h3></div><span className={`claim-state ${claim.state.toLowerCase()}`}>{readable(claim.state)}</span></header><p>Effective {when(claim.effectiveFrom)}{claim.effectiveTo ? ` to ${when(claim.effectiveTo)}` : " onward"}.</p><small>Asserted {when(claim.assertedAt)} · observed {when(claim.observedAt)}</small></article>)}</div></section>}
      {corrections.length > 0 && <section className="temporal-section"><p className="eyebrow">Correction history</p><div className="temporal-corrections">{corrections.map((correction) => { const prior = claimsById.get(correction.previousClaimId); const next = claimsById.get(correction.correctedClaimId); return <article key={correction.id}><ArrowRight size={17} /><div><p><b>{prior ? displayValue(prior.value) : "Prior claim"}</b> → <b>{next ? displayValue(next.value) : "Corrected claim"}</b></p><small>{correction.reason}</small></div><span className={correction.decision?.action === "ACCEPT" ? "accepted" : "pending"}>{correction.decision ? readable(correction.decision.action) : "pending review"}</span></article>; })}</div></section>}
    </section>}
  </main>;
}
