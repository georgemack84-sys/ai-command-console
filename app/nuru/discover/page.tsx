"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, Compass, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "../nuru.css";

type EditionItem = { position: number; lane: "FAMILIAR" | "ADJACENT" | "SERENDIPITY" | "WILDCARD"; score: number; explanation: string; candidate: { id: string; title: string; type: "book" | "documentary" | "article"; sourceFamily: string; sourceUrl: string; topics: string[]; confidence: number } };
type PreparedEdition = { persisted: true; repeated: boolean; edition: { editionDate: string; rankingVersion: string; items: EditionItem[] } | null; availableCandidateCount?: number; recentCandidateCount?: number };
type EmergingHypothesis = { topic: string; message: string; evidence: Array<{ candidateId: string; title: string }> };

const laneCopy: Record<EditionItem["lane"], string> = { FAMILIAR: "A clear connection to your Taste Map.", ADJACENT: "One thoughtful step beyond what you know.", SERENDIPITY: "A deliberate detour with room to surprise you.", WILDCARD: "A high-novelty leap, still grounded in a real source." };
function displayTitle(title: string) { return title.length > 72 ? `${title.slice(0, 69).trimEnd()}…` : title; }

export default function NuruDiscoverPage() {
  const [edition, setEdition] = useState<PreparedEdition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [lastDismissedCandidateId, setLastDismissedCandidateId] = useState<string | null>(null);
  const [hypotheses, setHypotheses] = useState<EmergingHypothesis[]>([]);

  useEffect(() => { void fetch("/api/nuru/discover/personal-edition", { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) }).then(async (response) => {
    const body = await response.json() as { ok: boolean; data?: PreparedEdition; error?: { message?: string } };
    if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Nuru could not prepare today’s edition.");
    setEdition(body.data);
  }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Nuru could not prepare today’s edition.")); }, []);
  useEffect(() => { void fetch("/api/nuru/discover/emerging-interests", { cache: "no-store" }).then(async (response) => { const body = await response.json() as { ok: boolean; data?: { hypotheses: EmergingHypothesis[] } }; if (response.ok && body.ok) setHypotheses(body.data?.hypotheses ?? []); }).catch(() => { /* A hypothesis is optional; the edition stays available. */ }); }, []);

  const items = useMemo(() => (edition?.edition?.items ?? []).filter((item) => {
    const matchesSearch = item.candidate.title.toLocaleLowerCase().includes(search.toLocaleLowerCase());
    const matchesTopic = !topicFilter || item.candidate.topics.some((topic) => topic.localeCompare(topicFilter, undefined, { sensitivity: "accent" }) === 0);
    return matchesSearch && matchesTopic;
  }), [edition, search, topicFilter]);
  const featured = items[0];
  async function recordReaction(candidateId: string, action: "SAVE" | "DISMISS") {
    try {
      const response = await fetch("/api/nuru/discover/personal-edition/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ candidateId, action }) });
      const body = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Nuru could not record that feedback.");
      if (action === "DISMISS") { setEdition((current) => current?.edition ? { ...current, edition: { ...current.edition, items: current.edition.items.filter((item) => item.candidate.id !== candidateId) } } : current); setLastDismissedCandidateId(candidateId); }
      setFeedbackMessage(action === "SAVE" ? "Saved. Nuru will retain that as explicit evidence." : "Removed. Nuru will not show this again unless you restore it.");
    } catch (cause) { setFeedbackMessage(cause instanceof Error ? cause.message : "Nuru could not record that feedback."); }
  }
  async function restoreLastDismissal() {
    if (!lastDismissedCandidateId) return;
    try {
      const response = await fetch("/api/nuru/discover/personal-edition/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ candidateId: lastDismissedCandidateId, action: "RESTORE" }) });
      const body = await response.json() as { ok: boolean; error?: { message?: string } };
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Nuru could not restore that discovery.");
      setLastDismissedCandidateId(null);
      setFeedbackMessage("Restored. Nuru may consider it again in a future edition; today’s edition remains fixed.");
    } catch (cause) { setFeedbackMessage(cause instanceof Error ? cause.message : "Nuru could not restore that discovery."); }
  }

  return <main className="nuru-shell personal-edition-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover" aria-label="Nuru Discover home"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link className="active" href="/nuru/discover">Discover</Link><Link href="/nuru/discover/onboarding">Taste Interview</Link><Link href="/nuru/discover/taste-map">Taste Map</Link><Link href="/nuru/discover/saved">Saved</Link></nav><label className="nuru-search"><Search size={17} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this edition…" aria-label="Search this edition" /></label></header>
    <section className="personal-edition-hero"><p className="eyebrow"><Sparkles size={16} fill="currentColor" /> One finite edition</p><h1>What you didn’t know<br />you’d love.</h1><p>Nuru found a small collection from trusted sources—held steady for today, with every choice explained.</p>{edition?.edition && <small>{edition.repeated ? "Your edition is waiting where you left it." : "Your edition is ready."} {edition.edition.items.length} {edition.edition.items.length === 1 ? "discovery" : "discoveries"} · {new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(edition.edition.editionDate))}</small>}</section>
    {error && <section className="edition-empty" role="alert"><h2>Nuru could not prepare today’s edition.</h2><p>{error}</p></section>}
    {!error && !edition && <section className="edition-empty"><Sparkles size={28} /><h2>Preparing your edition.</h2><p>Nuru is checking the source-backed discovery pool and your Taste Map.</p></section>}
    {edition?.edition && featured && <section className="personal-edition-feature" aria-labelledby="featured-discovery"><div className="personal-edition-art catalog-art" aria-hidden="true" /><div><p className="eyebrow">First discovery · {featured.lane.toLocaleLowerCase()}</p><h2 id="featured-discovery" title={featured.candidate.title}>{displayTitle(featured.candidate.title)}</h2><p className="edition-source">{featured.candidate.type} · {featured.candidate.sourceFamily} · {Math.round(featured.candidate.confidence * 100)}% source confidence</p><p>{featured.explanation}</p><div className="edition-actions"><Link className="gold-button" href={`/nuru/discover/edition/${featured.candidate.id}`}>Why Nuru chose this <ArrowUpRight size={16} /></Link><a className="quiet-button" href={featured.candidate.sourceUrl} target="_blank" rel="noreferrer">Source</a><button className="quiet-button" type="button" onClick={() => void recordReaction(featured.candidate.id, "SAVE")}><Bookmark size={16} /> Save</button><button className="quiet-button" type="button" onClick={() => void recordReaction(featured.candidate.id, "DISMISS")}><X size={16} /> Not for me</button></div></div><aside><p className="eyebrow">Why it’s here</p><h3>{featured.lane}</h3><p>{laneCopy[featured.lane]}</p><p className="edition-topics">{featured.candidate.topics.join(" · ") || "Source-backed discovery"}</p></aside></section>}
    {edition?.edition && !featured && <section className="edition-empty"><Compass size={28} /><h2>Today’s pool needs more new material.</h2><p>Nuru will not pad your edition with repeats. It is waiting for fresh, eligible discoveries from its trusted sources.</p></section>}
    {edition?.edition && items.length === 0 && edition.edition.items.length > 0 && <section className="edition-empty"><h2>No discovery matches that view.</h2><p>{topicFilter ? `Today’s fixed edition has no other discovery connected to ${topicFilter}.` : "Clear the search to return to today’s edition."}</p>{topicFilter && <button className="quiet-button" type="button" onClick={() => setTopicFilter(null)}>Show today’s full edition</button>}</section>}
    {edition?.edition && items.length > 0 && <section className="personal-edition-grid" aria-label="Today’s discoveries">{items.slice(1).map((item) => <article key={item.candidate.id}><p className="eyebrow">{item.lane}</p><h2 title={item.candidate.title}>{displayTitle(item.candidate.title)}</h2><p className="edition-source">{item.candidate.type} · {item.candidate.sourceFamily}</p><p>{item.explanation}</p><footer><span>{item.candidate.topics.join(" · ") || "Discovery"}</span><span><Link href={`/nuru/discover/edition/${item.candidate.id}`} aria-label={`Why Nuru chose ${item.candidate.title}`}><ArrowUpRight size={16} /></Link><button type="button" onClick={() => void recordReaction(item.candidate.id, "SAVE")} aria-label={`Save ${item.candidate.title}`}><Bookmark size={16} /></button><button type="button" onClick={() => void recordReaction(item.candidate.id, "DISMISS")} aria-label={`Remove ${item.candidate.title}`}><X size={16} /></button><a href={item.candidate.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${item.candidate.title}`}><ArrowUpRight size={18} /></a></span></footer></article>)}</section>}
    {edition?.edition && edition.edition.items.length < 7 && <section className="edition-integrity-note"><Sparkles size={18} /><p><b>Finite means honest.</b> Nuru found {edition.edition.items.length} new source-backed {edition.edition.items.length === 1 ? "discovery" : "discoveries"} today. It will not fill the remaining space with weaker or recently shown material.</p></section>}
    {topicFilter && <p className="edition-feedback-message" role="status">Showing discoveries connected to {topicFilter}. <button type="button" onClick={() => setTopicFilter(null)}>Show all</button></p>}
    {hypotheses.length > 0 && <section className="emerging-interest"><p className="eyebrow">A visible hypothesis</p>{hypotheses.map((hypothesis) => <article key={hypothesis.topic}><h2>{hypothesis.message}</h2><p>Based on your explicit saves: {hypothesis.evidence.map((item) => item.title).join(" · ")}</p><button className="quiet-button" type="button" onClick={() => setTopicFilter(hypothesis.topic)}>Explore carefully <ArrowUpRight size={15} /></button></article>)}</section>}
    {feedbackMessage && <p className="edition-feedback-message" role="status">{feedbackMessage} {lastDismissedCandidateId && <button type="button" onClick={() => void restoreLastDismissal()}>Undo removal</button>}</p>}
  </main>;
}
