"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Database, RefreshCw, Send, ShieldCheck } from "lucide-react";
import "../nuru.css";

type Discovery = { canonicalRecordId: string; candidateId: string; version: number; classification: string; interpretation: string; confidence: number };
type ReviewEvidence = { id: string; locator: string; contentHash: string; classification: string; source?: { id: string; origin?: string; authority?: string; contentHash?: string; classification?: string } };
type ReviewCandidate = { id: string; interpretation: string; confidence: number; classification: string; evidence: ReviewEvidence[] };
type CurrentRecord = { id: string; version: number; classification: string; candidateId: string };
type RegistrySource = { id: string; name: string; admissionState: string; enabled: boolean; operationalState: string; ingestionMethods: string[] };
type Timeline = { canonicalRecord: { id: string; version: number; status: string }; correlationId: string; events: Array<{ id: string; type: string; at: string; label: string; classification: string }> };
type TimelineSearchEvent = { id: string; type: string; at: string; label: string; classification: string; correlationId: string; sourceOrigins: string[] };
type VaultSource = { id: string; origin: string; authority: string; classification: string };
const initialForm = { sourceRegistryId: "", sourceContent: "", evidenceLocator: "", evidenceContent: "", interpretation: "", confidence: "0.8", classification: "PUBLIC" };

export function NuruVaultConsole() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [reviewCandidates, setReviewCandidates] = useState<ReviewCandidate[]>([]);
  const [currentRecords, setCurrentRecords] = useState<CurrentRecord[]>([]);
  const [supersessionSelections, setSupersessionSelections] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<RegistrySource[]>([]);
  const [reviewAvailable, setReviewAvailable] = useState(false);
  const [revision, setRevision] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [timelineSearch, setTimelineSearch] = useState({ correlationId: "", classification: "", eventType: "", sourceId: "" });
  const [timelineEvents, setTimelineEvents] = useState<TimelineSearchEvent[]>([]);
  const [vaultSources, setVaultSources] = useState<VaultSource[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("Loading canonical discoveries…");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/nuru/vault/discoveries", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message ?? "Nuru Vault couldn’t load discoveries.");
      setDiscoveries(payload.data.discoveries);
      setRevision(payload.data.revision);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nuru Vault couldn’t load discoveries.");
    }
  }, []);

  const loadReview = useCallback(async () => {
    try {
      const response = await fetch("/api/nuru/vault/review", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) return setReviewAvailable(false);
      setReviewCandidates(payload.data.candidates);
      setCurrentRecords(payload.data.currentRecords);
      setReviewAvailable(true);
    } catch { setReviewAvailable(false); }
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const response = await fetch("/api/nuru/source-registry", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) return setSources([]);
      setSources(payload.data.sources.filter((source: RegistrySource) => source.admissionState === "APPROVED" && source.enabled && source.operationalState === "HEALTHY" && source.ingestionMethods.includes("MANUAL")));
    } catch { setSources([]); }
  }, []);

  const loadVaultSources = useCallback(async () => { try { const response = await fetch("/api/nuru/vault/sources", { cache: "no-store" }); const payload = await response.json(); if (response.ok && payload.ok) setVaultSources(payload.data.sources); } catch {} }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void Promise.all([load(), loadReview(), loadSources(), loadVaultSources()]); }, 0);
    return () => window.clearTimeout(timer);
  }, [load, loadReview, loadSources, loadVaultSources]);

  async function approve(candidateId: string) {
    const supersedesRecordId = supersessionSelections[candidateId];
    const rationale = window.prompt(supersedesRecordId ? "Why should this evidence-backed candidate replace the selected canonical record?" : "Why should this evidence-backed candidate become canonical?");
    if (!rationale) return;
    const response = await fetch("/api/nuru/vault/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ candidateId, rationale, ...(supersedesRecordId ? { supersedesRecordId } : {}) }) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) return setMessage(payload.error?.message ?? "Nuru Vault couldn’t approve this candidate.");
    setMessage(supersedesRecordId ? "Candidate approved as a successor. The former record is retained as superseded history." : "Candidate approved and promoted to canonical knowledge.");
    await Promise.all([load(), loadReview()]);
  }

  async function showTimeline(canonicalRecordId: string) {
    setMessage("");
    try {
      const response = await fetch(`/api/nuru/vault/timeline/${encodeURIComponent(canonicalRecordId)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message ?? "Nuru Vault couldn’t load this timeline.");
      setTimeline(payload.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nuru Vault couldn’t load this timeline.");
    }
  }

  async function searchTimeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams(Object.entries(timelineSearch).filter(([, value]) => value));
    const response = await fetch(`/api/nuru/vault/timeline?${query}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) return setMessage(payload.error?.message ?? "Nuru Vault couldn’t search the timeline.");
    setTimelineEvents(payload.data.events);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/nuru/vault/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceRegistryId: form.sourceRegistryId,
          acquisitionMethod: "MANUAL",
          sourceContent: form.sourceContent,
          sourceClassification: form.classification,
          evidence: { locator: form.evidenceLocator, content: form.evidenceContent, classification: form.classification },
          candidate: { interpretation: form.interpretation, confidence: Number(form.confidence), classification: form.classification },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message ?? "Nuru Vault couldn’t accept this source.");
      setForm(initialForm);
      setMessage("Source, evidence, and candidate were recorded. A governed approval is still required before this can appear in discovery.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nuru Vault couldn’t accept this source.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="nuru-shell vault-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru"><span>NURU</span><small>Discover a deeper world</small></Link><nav><Link href="/nuru">Discover</Link><Link className="active" href="/nuru/vault">Vault</Link><Link href="/nuru/projects">Project decisions</Link><Link href="/nuru/data">Control my data</Link></nav></header>
    <section className="vault-hero"><Link href="/nuru" className="back-link"><ArrowLeft size={15} /> Today’s discoveries</Link><p className="eyebrow"><Database size={16} /> Governed memory</p><h1>Nuru Vault</h1><p>Every discovery here is a current canonical record with retained evidence and an auditable decision path.</p></section>
    <section className="vault-content">
      <header className="vault-section-header"><div><p className="eyebrow">Canonical discoveries</p><h2>What Nuru can safely retrieve</h2></div><button className="quiet-button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button></header>
      {revision && <p className="vault-revision">Vault revision {revision}</p>}
      {discoveries.length ? <div className="vault-discoveries">{discoveries.map((discovery) => <article key={discovery.canonicalRecordId}><p className="eyebrow"><ShieldCheck size={14} /> {discovery.classification} · version {discovery.version}</p><h3>Evidence-bound discovery</h3><p>{discovery.interpretation}</p><footer><span>Confidence {Math.round(discovery.confidence * 100)}%</span><button className="quiet-button" onClick={() => void showTimeline(discovery.canonicalRecordId)}>View trail</button></footer></article>)}</div> : !message && <div className="vault-empty"><Database size={26} /><h2>No canonical discoveries yet</h2><p>Intake records candidates first. They appear here only after governance approval.</p></div>}
      {timeline && <section className="vault-timeline"><header><div><p className="eyebrow">Immutable provenance trail</p><h2>Canonical version {timeline.canonicalRecord.version}</h2></div><button className="quiet-button" onClick={() => setTimeline(null)}>Close</button></header><p>Correlation <code>{timeline.correlationId}</code></p><ol>{timeline.events.map((event) => <li key={event.id}><time>{new Date(event.at).toLocaleString()}</time><b>{event.type.replaceAll("_", " ")}</b><span>{event.label}</span><small>{event.classification}</small></li>)}</ol></section>}
      <section className="vault-timeline"><p className="eyebrow">Timeline explorer</p><h2>Search the Vault ledger</h2><form onSubmit={(event) => void searchTimeline(event)}><input value={timelineSearch.correlationId} onChange={(event) => setTimelineSearch({ ...timelineSearch, correlationId: event.target.value })} placeholder="Correlation ID" /><select value={timelineSearch.sourceId} onChange={(event) => setTimelineSearch({ ...timelineSearch, sourceId: event.target.value })}><option value="">All retained sources</option>{vaultSources.map((source) => <option key={source.id} value={source.id}>{source.origin} · {source.authority}</option>)}</select><select value={timelineSearch.classification} onChange={(event) => setTimelineSearch({ ...timelineSearch, classification: event.target.value })}><option value="">All classifications</option>{["PUBLIC", "PERSONAL", "PRIVATE", "CONFIDENTIAL", "RESTRICTED", "SYSTEM"].map((value) => <option key={value}>{value}</option>)}</select><input value={timelineSearch.eventType} onChange={(event) => setTimelineSearch({ ...timelineSearch, eventType: event.target.value })} placeholder="Event type, e.g. RECORD_SUPERSEDED" /><button className="quiet-button">Search</button></form>{timelineEvents.length > 0 && <ol>{timelineEvents.map((event) => <li key={event.id}><time>{new Date(event.at).toLocaleString()}</time><b>{event.type.replaceAll("_", " ")}</b><span>{event.label}</span><small>{event.classification} · {event.correlationId}{event.sourceOrigins.length ? ` · ${event.sourceOrigins.join(", ")}` : ""}</small></li>)}</ol>}</section>
      {message && <p className="vault-message" role="status">{message}</p>}
      {reviewAvailable && <section className="vault-review"><p className="eyebrow">Manager review queue</p><h2>Pending candidates</h2>{reviewCandidates.length ? <div>{reviewCandidates.map((candidate) => <article key={candidate.id}><span>{candidate.classification} · confidence {Math.round(candidate.confidence * 100)}%</span><p>{candidate.interpretation}</p>{candidate.evidence.map((evidence) => <details key={evidence.id} className="vault-evidence"><summary>Evidence · {evidence.classification}</summary><p><b>Locator:</b> {evidence.locator}</p><p><b>Evidence hash:</b> <code>{evidence.contentHash}</code></p>{evidence.source && <><p><b>Source:</b> {evidence.source.origin} · {evidence.source.authority}</p><p><b>Source hash:</b> <code>{evidence.source.contentHash}</code></p></>}</details>)}{currentRecords.length > 0 && <label className="vault-supersession">Promotion target<select value={supersessionSelections[candidate.id] ?? ""} onChange={(event) => setSupersessionSelections({ ...supersessionSelections, [candidate.id]: event.target.value })}><option value="">Create a new canonical record</option>{currentRecords.map((record) => <option key={record.id} value={record.id}>Supersede version {record.version} · {record.id}</option>)}</select><small>Supersession preserves the selected record and its decision trail.</small></label>}<button className="gold-button" onClick={() => void approve(candidate.id)}><ShieldCheck size={15} /> {supersessionSelections[candidate.id] ? "Approve as successor" : "Approve and promote"}</button></article>)}</div> : <p>No candidates are waiting for review.</p>}</section>}
      <section className="vault-intake"><div><p className="eyebrow">Manager intake</p><h2>Add governed source material</h2><p>This records source material, evidence, and a candidate. It cannot make a canonical discovery on its own.</p></div><form onSubmit={(event) => void submit(event)}>
        <label>Approved source<select required value={form.sourceRegistryId} onChange={(event) => setForm({ ...form, sourceRegistryId: event.target.value })}><option value="">Choose an approved manual source…</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></label>
        {!sources.length && <p className="vault-form-note">No approved, healthy manual sources are available. Approve one in the Source Registry first.</p>}
        <label>Source content<textarea required value={form.sourceContent} onChange={(event) => setForm({ ...form, sourceContent: event.target.value })} /></label>
        <label>Evidence locator<input required value={form.evidenceLocator} onChange={(event) => setForm({ ...form, evidenceLocator: event.target.value })} placeholder="https://… or fixture://…" /></label>
        <label>Evidence excerpt<textarea required value={form.evidenceContent} onChange={(event) => setForm({ ...form, evidenceContent: event.target.value })} /></label>
        <label>Candidate interpretation<textarea required value={form.interpretation} onChange={(event) => setForm({ ...form, interpretation: event.target.value })} /></label>
        <div className="vault-form-row"><label>Confidence<input required type="number" min="0" max="1" step="0.01" value={form.confidence} onChange={(event) => setForm({ ...form, confidence: event.target.value })} /></label><label>Classification<select value={form.classification} onChange={(event) => setForm({ ...form, classification: event.target.value })}>{["PUBLIC", "PERSONAL", "PRIVATE", "CONFIDENTIAL", "RESTRICTED", "SYSTEM"].map((classification) => <option key={classification}>{classification}</option>)}</select></label></div>
        <button className="gold-button" disabled={submitting}><Send size={15} /> {submitting ? "Recording…" : "Record candidate"}</button>
      </form></section>
    </section>
  </main>;
}
