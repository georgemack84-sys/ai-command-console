"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Feather, Plus, Sparkles } from "lucide-react";
import "../nuru.css";

type StudioDiscovery = { id: string; title: string; meta: string; category: string; matchScore: number; isPublished: boolean; publishedAt: string | null; archivedAt: string | null; updatedAt: string };
const blankForm = { title: "", meta: "", category: "near_certain", matchScore: "80", imageUrl: "", sourceUrl: "", eyebrow: "", summary: "", rationale: "", connection: "", paths: "", isPublished: true };

export function NuruStudio({ editorName }: Readonly<{ editorName: string }>) {
  const [discoveries, setDiscoveries] = useState<StudioDiscovery[]>([]);
  const [form, setForm] = useState(blankForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/nuru/studio", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => response.ok && payload.ok ? setDiscoveries(payload.data as StudioDiscovery[]) : setMessage(payload.error?.message ?? "Nuru Studio couldn’t load its queue."))
      .catch(() => setMessage("Nuru Studio couldn’t load its queue."));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(editingId ? `/api/nuru/studio/${editingId}` : "/api/nuru/studio", { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, matchScore: Number(form.matchScore) }) });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok || !payload.ok) return setMessage(payload.error?.message ?? "Nuru couldn’t save this discovery.");
    setDiscoveries((current) => editingId ? current.map((item) => item.id === editingId ? payload.data as StudioDiscovery : item) : [payload.data as StudioDiscovery, ...current]);
    setForm(blankForm);
    setEditingId(null);
    setMessage(payload.data.isPublished ? "Discovery published to Nuru." : "Draft saved to the editorial queue.");
  }

  async function edit(id: string) { const response = await fetch(`/api/nuru/studio/${id}`, { cache: "no-store" }); const payload = await response.json(); if (!response.ok || !payload.ok) return setMessage(payload.error?.message ?? "Nuru couldn’t open that discovery."); const discovery = payload.data; setEditingId(id); setForm({ title: discovery.title, meta: discovery.meta, category: discovery.category, matchScore: String(discovery.matchScore), imageUrl: discovery.imageUrl ?? "", sourceUrl: discovery.sourceUrl ?? "", eyebrow: discovery.eyebrow, summary: discovery.summary, rationale: discovery.rationale, connection: discovery.connection, paths: discovery.paths.join("\n"), isPublished: discovery.isPublished }); }
  async function lifecycle(id: string, action: "publish" | "unpublish" | "archive") { const response = await fetch(`/api/nuru/studio/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) }); const payload = await response.json(); if (!response.ok || !payload.ok) return setMessage(payload.error?.message ?? "Nuru couldn’t update that discovery."); setDiscoveries((current) => current.map((item) => item.id === id ? payload.data as StudioDiscovery : item)); setMessage(action === "archive" ? "Discovery archived." : action === "publish" ? "Discovery published." : "Discovery returned to draft."); }

  return <main className="nuru-shell studio-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru">Discover</Link><Link href="/nuru/rabbit-holes/race-for-supersonic-flight">Rabbit Holes</Link><Link href="/nuru/collection">Saved</Link><Link href="/nuru/taste-map">Taste Map</Link></nav></header>
    <section className="studio-hero"><Link href="/nuru" className="back-link"><ArrowLeft size={15} /> Back to Nuru</Link><p className="eyebrow"><Feather size={16} /> Editorial workspace</p><h1>Nuru Studio</h1><p>Shape the small collection that earns someone’s time. Signed in as {editorName}.</p></section>
    <section className="studio-layout"><form className="studio-form" onSubmit={submit}><div className="studio-heading"><div><p className="eyebrow"><Plus size={15} /> {editingId ? "Edit discovery" : "New discovery"}</p><h2>{editingId ? "Refine what Nuru will say." : "Give Nuru something worth finding."}</h2></div><label className="publish-toggle"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> Publish now</label></div><div className="studio-fields"><label>Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="The story’s title" /></label><label>Format and attribution<input required value={form.meta} onChange={(event) => setForm({ ...form, meta: event.target.value })} placeholder="Book · Author · Year" /></label><label>Discovery category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="near_certain">Near certain</option><option value="adjacent">Adjacent</option><option value="serendipity">Serendipity</option><option value="wildcard">Wildcard</option><option value="featured">Featured</option></select></label><label>Match strength<input required min="0" max="100" type="number" value={form.matchScore} onChange={(event) => setForm({ ...form, matchScore: event.target.value })} /></label><label>Editorial artwork URL<input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://…" /></label><label>Source URL<input type="url" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="https://…" /></label><label className="wide">Short editorial line<input value={form.eyebrow} onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} placeholder="What makes this immediately compelling?" /></label><label className="wide">Why this is worth time<textarea required value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="The editorial summary…" /></label><label className="wide">Why Nuru chose this<textarea required value={form.rationale} onChange={(event) => setForm({ ...form, rationale: event.target.value })} placeholder="The personal reasoning…" /></label><label className="wide">Unexpected connection<textarea required value={form.connection} onChange={(event) => setForm({ ...form, connection: event.target.value })} placeholder="The surprising thread…" /></label><label className="wide">Follow-on paths<textarea value={form.paths} onChange={(event) => setForm({ ...form, paths: event.target.value })} placeholder={"One path per line\nCold War technology\nHidden systems"} /></label></div><button className="gold-button" disabled={saving}>{saving ? "Saving…" : form.isPublished ? "Publish discovery" : "Save draft"} <Check size={16} /></button>{editingId && <button type="button" className="quiet-button" onClick={() => { setEditingId(null); setForm(blankForm); }}>Cancel edit</button>}</form>
    <aside className="studio-queue"><p className="eyebrow"><Sparkles size={15} /> Editorial queue</p><h2>Recent discoveries</h2>{discoveries.length === 0 ? <p className="queue-empty">Your published and draft discoveries will appear here.</p> : <div>{discoveries.map((discovery) => <article key={discovery.id}><span>{discovery.archivedAt ? "Archived" : discovery.isPublished ? "Published" : "Draft"}</span><h3>{discovery.title}</h3><p>{discovery.meta}</p><small>{discovery.matchScore}% match · {discovery.category.replace("_", " ")}{discovery.publishedAt ? ` · Published ${new Date(discovery.publishedAt).toLocaleDateString()}` : ""}</small><div className="queue-actions"><button onClick={() => void edit(discovery.id)}>Edit</button>{!discovery.archivedAt && <><button onClick={() => void lifecycle(discovery.id, discovery.isPublished ? "unpublish" : "publish")}>{discovery.isPublished ? "Unpublish" : "Publish"}</button><button onClick={() => void lifecycle(discovery.id, "archive")}>Archive</button></>}{discovery.isPublished && !discovery.archivedAt && <Link href={`/nuru/discoveries/${discovery.id}`}>Preview <ExternalLink size={13} /></Link>}</div></article>)}</div>}</aside></section>
    {message && <div className="toast" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button></div>}
  </main>;
}
