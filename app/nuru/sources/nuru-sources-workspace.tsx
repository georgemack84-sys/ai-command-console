"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileUp, ShieldCheck, XCircle } from "lucide-react";
import "../nuru.css";

type Source = { id: string; name: string; domain?: string; baseUrl?: string; category: string; topics: string[]; ingestionMethods: string[]; admissionState: string; operationalState: string; enabled: boolean; requiresReview: boolean };
type Artifact = { id: string; sourceRegistryId: string; contentType: string; contentHash: string; byteLength: number; originalFilename?: string; originUrl?: string; submittedBy: string; retrievedAt: string };
type DocumentSection = { heading: string; content: string; ordinal: number };
type Document = { id: string; rawArtifactId: string; status: "EXTRACTED" | "EXTRACTION_PENDING"; title?: string | null; content?: string | null; sections: DocumentSection[]; extractionMethod: string; contentHash?: string | null };
type ApiResult<T> = { ok: boolean; data?: T; error?: { message?: string } };

const categories = ["GOVERNMENT", "ACADEMIC", "OFFICIAL", "NEWS", "DOCUMENTATION", "ORGANIZATION", "COMMUNITY", "PERSONAL", "UNKNOWN"];
const readable = (value: string) => value.replaceAll("_", " ").toLowerCase();
const supportedTypes = new Set(["text/plain", "text/markdown", "text/html", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

async function request<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init });
  const payload = await response.json() as ApiResult<T>;
  if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error?.message ?? "Nuru couldn’t complete that request.");
  return payload.data;
}

function base64FromFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nuru couldn’t read that file."));
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.readAsDataURL(file);
  });
}

export function NuruSourcesWorkspace() {
  const [sources, setSources] = useState<Source[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [newSource, setNewSource] = useState({ name: "", baseUrl: "", category: "DOCUMENTATION" });
  const [intake, setIntake] = useState({ sourceRegistryId: "", contentText: "", contentType: "text/markdown", filename: "" });

  const load = async () => {
    try {
      const [registry, receiptFeed] = await Promise.all([
        request<{ sources: Source[] }>("/api/nuru/source-registry"),
        request<{ artifacts: Artifact[]; documents: Document[] }>("/api/nuru/source-intake"),
      ]);
      setSources(registry.sources); setArtifacts(receiptFeed.artifacts); setDocuments(receiptFeed.documents); setSignedIn(true);
    } catch (error) {
      if (error instanceof Error && /Authentication required/i.test(error.message)) setSignedIn(false);
      else setMessage(error instanceof Error ? error.message : "Nuru couldn’t load Source Intelligence.");
    }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const intakeSources = useMemo(() => sources.filter((source) => source.enabled && source.operationalState !== "PAUSED" && ["APPROVED", "LIMITED"].includes(source.admissionState) && source.ingestionMethods.includes("MANUAL")), [sources]);

  async function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("source"); setMessage("");
    try {
      await request<{ source: Source }>("/api/nuru/source-registry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: newSource.name, baseUrl: newSource.baseUrl || undefined, category: newSource.category, ingestionMethods: ["MANUAL"] }) });
      setNewSource({ name: "", baseUrl: "", category: "DOCUMENTATION" }); setMessage("Source submitted for review."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nuru couldn’t submit the source."); }
    finally { setBusy(""); }
  }

  async function review(source: Source, action: "APPROVE" | "LIMIT" | "BLOCK" | "PAUSE") {
    const reason = window.prompt(`Why should ${source.name} be ${readable(action)}?`);
    if (!reason) return;
    setBusy(source.id); setMessage("");
    try {
      await request<{ source: Source }>(`/api/nuru/source-registry/${source.id}/review`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, reason }) });
      setMessage(`${source.name} was ${readable(action)}.`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nuru couldn’t record the review."); }
    finally { setBusy(""); }
  }

  async function ingest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("intake"); setMessage("");
    try {
      await request<{ artifact: Artifact }>("/api/nuru/source-intake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceRegistryId: intake.sourceRegistryId, contentType: intake.contentType, contentText: intake.contentText, originalFilename: intake.filename || undefined }) });
      setIntake((current) => ({ ...current, contentText: "", filename: "" })); setMessage("Original bytes stored. Nuru has not extracted or admitted this content."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nuru couldn’t store the artifact."); }
    finally { setBusy(""); }
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const contentType = file.type || "text/plain";
    if (!supportedTypes.has(contentType)) { setMessage("Use TXT, Markdown, HTML, PDF, or DOCX files."); return; }
    try { setIntake((current) => ({ ...current, contentText: "", contentType, filename: file.name })); const contentBase64 = await base64FromFile(file); setBusy("file"); await request<{ artifact: Artifact }>("/api/nuru/source-intake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceRegistryId: intake.sourceRegistryId, contentType, contentBase64, originalFilename: file.name }) }); setMessage("Original file bytes stored. Nuru has not extracted or admitted this content."); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Nuru couldn’t store that file."); }
    finally { setBusy(""); event.target.value = ""; }
  }

  async function extractArtifact(artifact: Artifact) {
    setBusy(artifact.id); setMessage("");
    try {
      const result = await request<{ document: Document }>(`/api/nuru/source-intake/${artifact.id}/extract`, { method: "POST" });
      setSelectedDocument(result.document); setMessage(result.document.status === "EXTRACTED" ? "Normalized document created. It remains outside canonical knowledge." : "The original is preserved; this file awaits a dedicated parser."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nuru couldn’t extract that artifact."); }
    finally { setBusy(""); }
  }


  if (signedIn === false) return <main className="nuru-shell sources-shell"><section className="sources-login"><ShieldCheck /><h1>Source Intelligence is governed.</h1><p>Sign in to submit sources, review access, and preserve source material.</p><Link className="gold-button" href="/auth">Sign in</Link></section></main>;
  return <main className="nuru-shell sources-shell"><header className="nuru-nav"><Link className="nuru-brand" href="/nuru"><span>NURU</span><small>Discover a deeper world</small></Link><nav><Link href="/nuru">Discover</Link><Link href="/nuru/learning">What Nuru learned</Link><Link className="active" href="/nuru/sources">Sources</Link><Link href="/nuru/data">Control my data</Link></nav></header><section className="sources-hero"><Link href="/nuru" className="back-link"><ArrowLeft size={15} /> Today’s discoveries</Link><p className="eyebrow"><ShieldCheck size={16} /> Nuru Source Intelligence</p><h1>Know where knowledge came from.</h1><p>Every source is reviewed. Every imported artifact is preserved before Nuru can interpret it.</p></section><section className="sources-grid"><article className="source-card"><ClipboardCheck /><p className="eyebrow">Register</p><h2>Submit a source</h2><form onSubmit={submitSource}><label>Name<input required value={newSource.name} onChange={(event) => setNewSource({ ...newSource, name: event.target.value })} placeholder="NASA Technical Reports" /></label><label>Base URL <small>optional</small><input type="url" value={newSource.baseUrl} onChange={(event) => setNewSource({ ...newSource, baseUrl: event.target.value })} placeholder="https://example.org" /></label><label>Category<select value={newSource.category} onChange={(event) => setNewSource({ ...newSource, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><button className="gold-button" disabled={busy === "source"}>{busy === "source" ? "Submitting…" : "Submit for review"}</button></form></article><article className="source-card source-intake"><FileUp /><p className="eyebrow">Preserve</p><h2>Manual intake</h2><p>Stored originals are not yet extracted, summarized, or admitted to knowledge.</p><form onSubmit={ingest}><label>Approved source<select required value={intake.sourceRegistryId} onChange={(event) => setIntake({ ...intake, sourceRegistryId: event.target.value })}><option value="">Select a source</option>{intakeSources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></label><label>Text or Markdown<textarea value={intake.contentText} onChange={(event) => setIntake({ ...intake, contentText: event.target.value })} placeholder="Paste source material exactly as received." /></label><button className="quiet-button" disabled={busy === "intake" || !intake.contentText}>{busy === "intake" ? "Storing…" : "Store text artifact"}</button></form><label className="file-picker">Or upload a file<input type="file" accept=".txt,.md,.html,.pdf,.docx,text/plain,text/markdown,text/html,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={!intake.sourceRegistryId || busy === "file"} onChange={(event) => void chooseFile(event)} /><span>{busy === "file" ? "Storing file…" : "Choose TXT, MD, HTML, PDF, or DOCX"}</span></label></article></section><section className="source-review"><header><div><p className="eyebrow">Review queue</p><h2>Source decisions</h2></div><small>{sources.filter((source) => source.requiresReview).length} awaiting review</small></header>{sources.length === 0 ? <p className="sources-empty">No sources registered yet.</p> : <div className="source-list">{sources.map((source) => <article key={source.id}><div><span className={`source-state ${source.admissionState.toLowerCase()}`}>{readable(source.admissionState)}</span><h3>{source.name}</h3><p>{source.domain ?? source.category} · {source.ingestionMethods.map(readable).join(", ")}</p></div><div className="source-actions">{source.requiresReview && <><button onClick={() => void review(source, "APPROVE")} disabled={busy === source.id}><CheckCircle2 size={15} /> Approve</button><button onClick={() => void review(source, "LIMIT")} disabled={busy === source.id}>Limit</button><button onClick={() => void review(source, "BLOCK")} disabled={busy === source.id}><XCircle size={15} /> Block</button></>}<button className="quiet-button" onClick={() => void review(source, "PAUSE")} disabled={busy === source.id || source.operationalState === "PAUSED"}>Pause</button></div></article>)}</div>}</section><section className="artifact-receipts"><header><div><p className="eyebrow">Raw store</p><h2>Artifact receipts</h2></div><small>{artifacts.length} retained</small></header>{artifacts.length === 0 ? <p className="sources-empty">No raw artifacts have been stored.</p> : <div>{artifacts.map((artifact) => { const document = documents.find((item) => item.rawArtifactId === artifact.id); return <article key={artifact.id}><b>{artifact.originalFilename ?? artifact.contentType}</b><span>{artifact.byteLength.toLocaleString()} bytes · {new Date(artifact.retrievedAt).toLocaleString()}</span><code>{artifact.contentHash}</code><footer>{document ? <><em className={document.status === "EXTRACTED" ? "extracted" : "pending"}>{readable(document.status)}</em><button onClick={() => setSelectedDocument(document)}>View document</button></> : <button onClick={() => void extractArtifact(artifact)} disabled={busy === artifact.id}>{busy === artifact.id ? "Extracting…" : "Extract document"}</button>}</footer></article>; })}</div>}</section>{selectedDocument && <section className="normalized-document"><header><div><p className="eyebrow">Normalized document</p><h2>{selectedDocument.title ?? "Untitled source material"}</h2><small>{readable(selectedDocument.status)} · {selectedDocument.extractionMethod}</small></div><button className="quiet-button" onClick={() => setSelectedDocument(null)}>Close</button></header>{selectedDocument.status === "EXTRACTION_PENDING" ? <p>This original is safely retained, but its format needs a dedicated parser before Nuru can extract text.</p> : <div className="document-sections">{selectedDocument.sections.map((section) => <article key={section.ordinal} id={`artifact-${selectedDocument.rawArtifactId}-section-${section.ordinal}`}><small>Passage {section.ordinal + 1} · <code>{selectedDocument.rawArtifactId}#section-{section.ordinal + 1}</code></small><h3>{section.heading}</h3><p>{section.content}</p></article>)}</div>}<footer>Derived from raw artifact <code>{selectedDocument.rawArtifactId}</code>{selectedDocument.contentHash && <> · normalized hash <code>{selectedDocument.contentHash}</code></>}</footer></section>}{message && <div className="toast" role="status">{message}<button onClick={() => setMessage("")}>×</button></div>}</main>;
}
