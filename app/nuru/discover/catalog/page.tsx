"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import "../../nuru.css";

type KnowledgeItem = { id: string; title: string; contentType: string; project: string | null; confidence: number; status: string };
type CatalogItem = { knowledgeItemId: string; topics: string[]; reason: string };
type CatalogDecision = CatalogItem & { status: "ACTIVE" | "WITHDRAWN" };
type ApiResponse<T> = { ok: boolean; data?: T; error?: { message?: string } };

async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json() as ApiResponse<T>;
  if (!response.ok || !body.ok || body.data === undefined) throw new Error(body.error?.message ?? "Unable to load catalog data.");
  return body.data;
}

export default function NuruDiscoverCatalogPage() {
  const searchParams = useSearchParams();
  const requestedItem = searchParams.get("item");
  const requestedTopics = searchParams.get("topics");
  const requestedReason = searchParams.get("reason");
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogDecisions, setCatalogDecisions] = useState<CatalogDecision[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [topics, setTopics] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      getData<KnowledgeItem[]>("/api/nuru/knowledge?status=APPROVED"),
      getData<CatalogItem[]>("/api/nuru/discover/catalog"),
      getData<CatalogDecision[]>("/api/nuru/discover/catalog?decisions=all"),
    ]).then(([rows, entries, decisions]) => {
      setItems(rows);
      setCatalog(entries);
      setCatalogDecisions(decisions);
      setSelectedId(rows.some((row) => row.id === requestedItem) ? requestedItem : rows[0]?.id ?? null);
    }).catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : "Unable to load catalog intake."));
  }, [requestedItem]);

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);
  const existing = useMemo(() => catalog.find((item) => item.knowledgeItemId === selectedId) ?? null, [catalog, selectedId]);
  const awaitingCatalog = useMemo(() => items.filter((item) => !catalogDecisions.some((entry) => entry.knowledgeItemId === item.id)), [catalogDecisions, items]);

  useEffect(() => {
    const resetEditor = () => {
      setTopics(existing?.topics.join(", ") ?? (selectedId === requestedItem ? requestedTopics ?? "" : ""));
      setReason(existing?.reason ?? (selectedId === requestedItem ? requestedReason ?? "" : ""));
    };
    queueMicrotask(resetEditor);
  // Reload the selected entry when catalog data arrives or selection changes.
  // The update operation owns its success message and is not cleared here.
  }, [existing, requestedItem, requestedReason, requestedTopics, selectedId]);

  async function update(discoverability: "DISCOVERABLE" | "NOT_DISCOVERABLE") {
    if (!selected) return;
    if (reason.trim().length < 3) {
      setMessage("Record a short human reason before changing the catalog.");
      return;
    }
    const topicValues = [...new Set(topics.split(",").map((topic) => topic.trim()).filter(Boolean))].slice(0, 12);
    setBusy(true);
    try {
      const response = await fetch(`/api/nuru/discover/catalog/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ discoverability, topics: topicValues, reason: reason.trim() }),
      });
      const body = await response.json() as ApiResponse<{ item: CatalogItem | null }>;
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to update the catalog.");
      setCatalog((current) => discoverability === "DISCOVERABLE"
        ? [...current.filter((item) => item.knowledgeItemId !== selected.id), { knowledgeItemId: selected.id, topics: topicValues, reason: reason.trim() }]
        : current.filter((item) => item.knowledgeItemId !== selected.id));
      setCatalogDecisions((current) => [...current.filter((item) => item.knowledgeItemId !== selected.id), { knowledgeItemId: selected.id, status: discoverability === "DISCOVERABLE" ? "ACTIVE" : "WITHDRAWN", topics: topicValues, reason: reason.trim() }]);
      setMessage(discoverability === "DISCOVERABLE" ? "Catalog entry saved. The canonical knowledge record was not changed." : "Catalog entry withdrawn. The canonical knowledge record was not changed.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to update the catalog.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="nuru-shell catalog-intake-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/discover">Discover</Link><Link href="/nuru/discover/taste-map">Taste Map</Link><Link href="/nuru/explorer">Knowledge</Link></nav></header>
    <section className="catalog-intake-hero"><Link className="back-link" href="/nuru/discover"><ArrowLeft size={16} /> Back to Discover</Link><p className="eyebrow">Human catalog curation</p><h1>Catalog intake</h1><p>Choose which approved knowledge belongs in Discover. This changes a separate presentation catalog; it never changes canonical knowledge.</p>{requestedItem && <p className="catalog-followup-note">Canonical approval is complete. Record a separate catalog decision below; relationship review remains a separate step.</p>}</section>
    <section className="catalog-awaiting" aria-label="Approved knowledge awaiting catalog decisions"><div><p className="eyebrow">Decision queue</p><h2>{awaitingCatalog.length ? `${awaitingCatalog.length} approved record${awaitingCatalog.length === 1 ? "" : "s"} awaiting catalog decision` : "Every approved record has an explicit catalog decision"}</h2><p>Canonical approval and Discover admission are deliberately separate. Select a record to record a human presentation decision; this never creates a relationship.</p></div>{awaitingCatalog.length > 0 && <div className="catalog-awaiting-items">{awaitingCatalog.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setMessage(null); }}><span>{item.contentType} · {Math.round(item.confidence * 100)}%</span><b>{item.title}</b><small>Review catalog fit →</small></button>)}</div>}</section>
    <section className="catalog-intake-layout">
      <aside className="catalog-list"><p className="eyebrow">Approved knowledge</p>{items.map((item) => <button key={item.id} aria-pressed={item.id === selectedId} className={item.id === selectedId ? "selected" : ""} onClick={() => { setSelectedId(item.id); setMessage(null); }}><span>{catalog.some((entry) => entry.knowledgeItemId === item.id) && <CheckCircle2 size={15} />}{item.project ?? "Unscoped"}</span><b>{item.title}</b><small>{item.id === selectedId ? "Currently editing · " : ""}{item.contentType} · {Math.round(item.confidence * 100)}%</small></button>)}{!items.length && <p>No approved knowledge is available.</p>}</aside>
      <section className="catalog-editor">{selected ? <><p className="eyebrow">Presentation record</p><h2>{selected.title}</h2><p className="catalog-state">{existing ? "Currently admitted to Discover" : "Not currently admitted"}</p><label>Topics <input value={topics} onChange={(event) => setTopics(event.target.value)} placeholder="architecture, governance, services" /></label><small>Comma-separated presentation topics; optional, maximum 12.</small><label>Human reason <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why should this durable record be visible in Discover?" /></label><div className="catalog-buttons"><button className="gold-button" disabled={busy} onClick={() => void update("DISCOVERABLE")}>{existing ? "Update catalog entry" : "Admit to Discover"}</button><button className="quiet-button" disabled={busy || !existing} onClick={() => void update("NOT_DISCOVERABLE")}>Withdraw</button></div>{message && <p role="status" className="catalog-message">{message}</p>}</> : <p>Select an approved item to curate.</p>}</section>
    </section>
  </main>;
}
