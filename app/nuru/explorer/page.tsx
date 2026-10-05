"use client";

import { useEffect, useState } from "react";

type Item = { id: string; title: string; contentType: string; status: string; project?: string | null; confidence: number; createdAt: string };
type Source = { sourceType?: string; origin?: string; authority?: string; uri?: string };
type ItemDetail = Item & { content: string; source?: Source; metadata?: Record<string, unknown>; provenance?: { submittedBy?: string; source?: Source } };
type Relationship = { id: string; relationshipType: string; sourceItemId: string; targetItemId: string; confidence: number; status: string };
type Proposal = { itemId: string; status: string; recommendation: string; qualityStatus: string; decisionReason?: string | null; reviewedBy?: string | null; reviewedAt?: string | null };
type CatalogItem = { knowledgeItemId: string };
type ApiResponse<T> = { ok: boolean; data?: T; error?: { message?: string } };

const field = { width: "100%", padding: 10, background: "#101616", color: "#f3eadb", border: "1px solid rgba(225,202,158,.32)" };
const canonicalStatuses = "APPROVED,ARCHIVED,SUPERSEDED";

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json() as ApiResponse<T>;
  if (!response.ok || !body.ok || body.data === undefined) throw new Error(body.error?.message ?? "Unable to load Nuru knowledge.");
  return body.data;
}

export default function NuruExplorerPage() {
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("");
  const [type, setType] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catalogReason, setCatalogReason] = useState("");
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);
  const [catalogItemIds, setCatalogItemIds] = useState<string[]>([]);

  useEffect(() => {
    const parameters = new URLSearchParams({ status: canonicalStatuses });
    if (query) parameters.set("query", query);
    if (project) parameters.set("project", project);
    if (type) parameters.set("type", type);

    void Promise.all([
      fetchData<Item[]>(`/api/nuru/knowledge?${parameters}`),
      fetchData<CatalogItem[]>("/api/nuru/discover/catalog"),
    ]).then(([rows, catalog]) => {
        setItems(rows);
        setCatalogItemIds(catalog.map((entry) => entry.knowledgeItemId));
        setSelectedId((current) => rows.some((item) => item.id === current) ? current : rows[0]?.id ?? null);
        setError(null);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load Nuru knowledge."));
  }, [query, project, type]);

  useEffect(() => {
    if (!selectedId) {
      queueMicrotask(() => {
        setDetail(null);
        setRelationships([]);
        setProposal(null);
        setCatalogMessage(null);
      });
      return;
    }

    void Promise.all([
      fetchData<ItemDetail>(`/api/nuru/knowledge/${selectedId}`),
      fetchData<Relationship[]>(`/api/nuru/knowledge/${selectedId}/relationships`),
      fetchData<Proposal[]>("/api/nuru/agents"),
    ]).then(([item, edges, proposals]) => {
      setDetail(item);
      setRelationships(edges);
      setProposal(proposals.find((entry) => entry.itemId === item.id) ?? null);
      setCatalogReason("");
      setCatalogMessage(null);
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load the selected knowledge item."));
  }, [selectedId]);

  async function updateCatalogAdmission(discoverability: "DISCOVERABLE" | "NOT_DISCOVERABLE") {
    if (!detail || catalogReason.trim().length < 3) {
      setCatalogMessage("Record a short reason before changing Discover eligibility.");
      return;
    }
    setCatalogBusy(true);
    try {
      const response = await fetch(`/api/nuru/discover/catalog/${detail.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ discoverability, reason: catalogReason }),
      });
      const body = await response.json() as ApiResponse<{ discoverability: string }>;
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to update Discover eligibility.");
      setCatalogItemIds((current) => discoverability === "DISCOVERABLE"
        ? [...new Set([...current, detail.id])]
        : current.filter((id) => id !== detail.id));
      setCatalogMessage(discoverability === "DISCOVERABLE" ? "Admitted to Discover and recorded in the audit history." : "Withdrawn from Discover and recorded in the audit history.");
      setCatalogReason("");
    } catch (cause) {
      setCatalogMessage(cause instanceof Error ? cause.message : "Unable to update Discover eligibility.");
    } finally {
      setCatalogBusy(false);
    }
  }

  const isDiscoverable = detail ? catalogItemIds.includes(detail.id) : false;

  return <main className="nuru-shell"><section style={{ maxWidth: 1120, margin: "auto", padding: "55px 0" }}>
    <p className="eyebrow">Nuru / Knowledge</p><h1 style={{ fontFamily: "'DM Serif Display'", fontSize: 54 }}>Knowledge Explorer</h1>
    <p>Browse durable knowledge and inspect the evidence that made it governable.</p>
    <input aria-label="Search Nuru knowledge" placeholder="Search approved Nuru knowledge..." value={query} onChange={(event) => setQuery(event.target.value)} style={field} />
    {error && <p role="alert">Unable to load Explorer data: {error}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0, 1fr) 330px", gap: 24, marginTop: 24 }}>
      <aside><p className="eyebrow">Filters</p><label>Project<input value={project} onChange={(event) => setProject(event.target.value)} style={field} /></label><label>Type<input value={type} onChange={(event) => setType(event.target.value)} style={field} /></label><p style={{ marginTop: 20, fontSize: 13 }}>Showing approved, archived, and superseded knowledge. Rejected proposals stay outside the Explorer.</p></aside>
      <div>{items.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} style={{ ...field, cursor: "pointer", textAlign: "left", marginBottom: 12, background: selectedId === item.id ? "#242b28" : "#101616" }}><small>{item.project ?? "Unscoped"} · {item.status}</small><h2 style={{ margin: "7px 0" }}>{item.title}</h2><p style={{ margin: 0 }}>{item.contentType} · {Math.round(item.confidence * 100)}% confidence</p></button>)}{!items.length && <p>No durable knowledge matches this search.</p>}</div>
      <aside style={{ padding: 20, border: "1px solid rgba(225,202,158,.32)" }}><p className="eyebrow">Knowledge record</p>{detail ? <><h2>{detail.title}</h2><p>{detail.content}</p><hr /><p><b>Status:</b> {detail.status}</p><p><b>Source:</b> {detail.source?.origin ?? detail.provenance?.source?.origin ?? "Not recorded"}</p><p><b>Authority:</b> {detail.source?.authority ?? detail.provenance?.source?.authority ?? "Not recorded"}</p><p><b>Provenance:</b> submitted by {detail.provenance?.submittedBy ?? "Nuru"}</p><p><b>Relationships:</b> {relationships.length}</p>{relationships.length > 0 && <ul>{relationships.map((edge) => <li key={edge.id}>{edge.relationshipType} · {Math.round(edge.confidence * 100)}%</li>)}</ul>}<hr /><p className="eyebrow">Discover catalog</p><p><b>Eligibility:</b> {isDiscoverable ? "DISCOVERABLE" : "Not admitted"}</p>{detail.status === "APPROVED" && <><label>Reason<textarea aria-label="Catalog admission reason" value={catalogReason} onChange={(event) => setCatalogReason(event.target.value)} placeholder="Why should this item enter or leave Discover?" style={{ ...field, minHeight: 72, resize: "vertical" }} /></label><div style={{ display: "flex", gap: 8, marginTop: 8 }}><button type="button" disabled={catalogBusy || isDiscoverable} onClick={() => void updateCatalogAdmission("DISCOVERABLE")} style={field}>Admit to Discover</button><button type="button" disabled={catalogBusy || !isDiscoverable} onClick={() => void updateCatalogAdmission("NOT_DISCOVERABLE")} style={field}>Withdraw</button></div>{catalogMessage && <p role="status">{catalogMessage}</p>}</>}<hr /><p className="eyebrow">Governance decision</p>{proposal ? <><p><b>{proposal.status.replaceAll("_", " ")}</b> · {proposal.recommendation}</p><p>{proposal.qualityStatus.replaceAll("_", " ")}</p>{proposal.decisionReason && <p>{proposal.decisionReason}</p>}<small>{proposal.reviewedBy ? `Reviewed by ${proposal.reviewedBy}` : "Awaiting a recorded decision"}{proposal.reviewedAt ? ` · ${new Date(proposal.reviewedAt).toLocaleString()}` : ""}</small></> : <p>No curation proposal is linked to this record.</p>}</> : <p>Select a knowledge item to inspect its record.</p>}</aside>
    </div>
  </section></main>;
}
