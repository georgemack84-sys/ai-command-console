"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, FilePlus2, ShieldCheck } from "lucide-react";
import "../../nuru.css";

const blank = {
  title: "",
  notes: "",
  origin: "",
  project: "Nuru",
  sourceType: "HUMAN_INPUT",
  authority: "OWNER",
  topics: "",
  humanReason: "",
};

const soilHealthDraft = {
  title: "Soil health for small-scale gardening",
  notes: "USDA NRCS describes soil health as the capacity of soil to function as a living ecosystem. Its small-scale agriculture guidance emphasizes minimizing disturbance, maintaining soil cover, increasing biodiversity, and supporting continuous living roots. This is a practical starting point for gardeners interested in resilient, healthy soil.",
  origin: "USDA NRCS — Soil Health and Small-scale Agriculture: https://www.nrcs.usda.gov/conservation-basics/soil/soil-health/soil-health-and-small-scale-agriculture",
  project: "Discover",
  sourceType: "WEB_SOURCE",
  authority: "HIGH",
};

const pollinatorDraft = {
  title: "Designing a pollinator garden",
  notes: "USDA NRCS pollinator-garden guidance recommends selecting native flowering plants that provide nectar and pollen across the growing season. It also advises clustering the same plant species to support efficient foraging and leaving appropriate bare soil areas for ground-nesting native bees. This is an adjacent, practical companion to soil-health guidance for gardeners.",
  origin: "USDA NRCS — Pollinator Gardens Design Guide: https://www.nrcs.usda.gov/sites/default/files/2025-04/PollinatorGardensDesignGuide-BK-24.pdf",
  project: "Discover",
  sourceType: "WEB_SOURCE",
  authority: "HIGH",
};

const webbDraft = {
  title: "Seeing the early universe with the James Webb Space Telescope",
  notes: "NASA explains that the James Webb Space Telescope observes near- and mid-infrared light, allowing astronomers to study regions hidden by dust and investigate the early universe, galaxy evolution, star formation, and other worlds. Its infrared sensitivity reveals phenomena that visible-light observations cannot show. This is a high-quality wildcard for someone exploring beyond gardening.",
  origin: "NASA Science — James Webb Space Telescope Science Overview: https://science.nasa.gov/mission/webb/science-overview/",
  project: "Discover",
  sourceType: "WEB_SOURCE",
  authority: "HIGH",
};

export default function NuruDiscoverIntakePage() {
  const searchParams = useSearchParams();
  const terminalFrom = searchParams.get("from");
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/nuru/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: [form.notes, `Human rationale for review: ${form.humanReason}`, form.topics.trim() ? `Suggested presentation topics: ${form.topics.trim()}` : null, terminalFrom ? `Journey context: submitted from the terminal step “${terminalFrom}”.` : null].filter(Boolean).join("\n\n"),
          project: form.project || undefined,
          source: { sourceType: form.sourceType, origin: form.origin, authority: form.authority },
          submission: { humanReason: form.humanReason, proposedTopics: form.topics.split(",").map((topic) => topic.trim()).filter(Boolean), ...(terminalFrom ? { journeyContext: terminalFrom } : {}) },
        }),
      });
      const body = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Unable to create a governed proposal.");
      setForm(blank);
      setMessage("Proposal created. Nuru will preserve its source and route it to human review; it is not in Discover yet.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to create a governed proposal.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="nuru-shell intake-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/discover">Discover</Link><Link href="/nuru/discover/interests">Interests</Link><Link className="active" href="/nuru/discover/intake">Submit a source</Link><Link href="/nuru/discover/saved">Saved</Link><Link href="/nuru/discover/taste-map">Taste Map</Link></nav></header>
    <section className="intake-hero"><Link className="back-link" href="/nuru/discover"><ArrowLeft size={16} /> Back to Discover</Link><p className="eyebrow"><FilePlus2 size={16} /> Governed discovery intake</p><h1>Bring something<br />worth discovering.</h1><p>Submit a source with your notes. Nuru will treat it as data, preserve its provenance, and prepare a proposal for human review.</p></section>
    <section className="intake-layout"><form className="discover-intake-form" onSubmit={submit}><p className="eyebrow">Source details</p>{terminalFrom && <p className="intake-journey-context">Extending from terminal step: <b>{terminalFrom}</b>. This context is recorded for review, not treated as a relationship.</p>}<label>Title<input required minLength={3} maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. The Living Soil" /></label><label>What should Nuru assess?<textarea required minLength={20} maxLength={12000} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Paste a short excerpt, summary, or notes. Nuru does not fetch or trust a URL on its own." /></label><label>Human rationale for review<textarea required minLength={10} maxLength={2000} value={form.humanReason} onChange={(event) => setForm({ ...form, humanReason: event.target.value })} placeholder="Why is this source worth governing and potentially connecting to the current journey?" /></label><div className="intake-fields"><label>Source type<select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}><option value="HUMAN_INPUT">Your notes</option><option value="WEB_SOURCE">Web source</option><option value="PROJECT_DOCUMENT">Document</option><option value="API">API</option></select></label><label>Authority<select value={form.authority} onChange={(event) => setForm({ ...form, authority: event.target.value })}><option value="OWNER">Owner</option><option value="HIGH">High</option><option value="MODERATE">Moderate</option><option value="LOW">Low</option></select></label><label className="wide">Source origin<input required value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} placeholder="URL, book title, author, or your source note" /></label><label className="wide">Proposed topics<input value={form.topics} onChange={(event) => setForm({ ...form, topics: event.target.value })} placeholder="Optional, comma-separated topics for human review" /></label></div><button className="gold-button" disabled={busy}>{busy ? "Preparing proposal…" : "Submit for review"} <ArrowRight size={16} /></button></form><aside className="intake-guardrails"><p className="eyebrow"><FilePlus2 size={16} /> Starter sources</p><h2>Soil health</h2><p>Practical USDA guidance for small-scale gardening.</p><button type="button" className="quiet-button" onClick={() => setForm({ ...soilHealthDraft, topics: "gardening, soil health, ecology", humanReason: "This provides practical, evidence-based guidance for a governed gardening recommendation." })}>Use soil-health draft</button><h2>Pollinator gardens</h2><p>An adjacent USDA guide on native plants, seasonal blooms, and pollinator habitat.</p><button type="button" className="quiet-button" onClick={() => setForm({ ...pollinatorDraft, topics: "gardening, pollinators, native plants, ecology", humanReason: "This complements soil-health guidance with practical pollinator habitat design." })}>Use pollinator draft</button><h2>Webb telescope</h2><p>A NASA introduction to infrared astronomy and the early universe.</p><button type="button" className="quiet-button" onClick={() => setForm({ ...webbDraft, topics: "space, astronomy, infrared, early universe", humanReason: "This is an authoritative, explainable entry point for astronomy discovery." })}>Use Webb telescope draft</button><a href="https://science.nasa.gov/mission/webb/science-overview/" target="_blank" rel="noreferrer">Read NASA&apos;s science overview <ArrowRight size={14} /></a><hr /><p className="eyebrow"><ShieldCheck size={16} /> What happens next</p><ol><li>Nuru records the submitted source and runs its specialist assessment.</li><li>A human governor reviews the proposal before it can become canonical knowledge.</li><li>A governor separately decides whether approved knowledge belongs in Discover.</li></ol><p>Submitting a source never changes the catalog or your recommendations by itself.</p><Link className="quiet-button" href="/nuru/review">Open review queue</Link></aside></section>{message && <p className="intake-message" role="status">{message}</p>}
  </main>;
}
