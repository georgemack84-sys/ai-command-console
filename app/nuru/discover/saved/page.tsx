"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, ShieldCheck } from "lucide-react";
import "../../nuru.css";

type SavedDiscovery = {
  candidate: { id: string; title: string; type: "book" | "documentary" | "article"; sourceFamily: string; topics: string[]; confidence: number };
  savedAt: string;
};

export default function NuruSavedDiscoveriesPage() {
  const [saved, setSaved] = useState<SavedDiscovery[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/nuru/discover/personal-edition/saved", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { ok: boolean; data?: { discoveries: SavedDiscovery[] }; error?: { message?: string } };
        if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to load saved discoveries.");
        setSaved(body.data.discoveries);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load saved discoveries."));
  }, []);

  return <main className="nuru-shell saved-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/discover">Discover</Link><Link className="active" href="/nuru/discover/saved">Saved</Link><Link href="/nuru/discover/taste-map">Taste Map</Link></nav></header>
    <section className="saved-hero"><Link className="back-link" href="/nuru/discover"><ArrowLeft size={16} /> Back to Discover</Link><p className="eyebrow"><Bookmark size={16} fill="currentColor" /> Your private collection</p><h1>Saved discoveries</h1><p>Only your explicit Save choices appear here. Your collection is private evidence for Nuru—not a permanent label.</p></section>
    <section className="saved-content">{error && <p role="alert">{error}</p>}{!saved && !error && <p>Loading your saved discoveries…</p>}{saved && saved.length === 0 && <div className="saved-empty"><Bookmark size={31} /><h2>Nothing saved yet.</h2><p>When a discovery catches your interest, choose Save. It will appear here and become transparent evidence for your Taste Map.</p><Link className="gold-button" href="/nuru/discover">Explore Discover <ArrowRight size={16} /></Link></div>}{saved?.map(({ candidate, savedAt }) => <article className="saved-card" key={candidate.id}><div className="saved-card-art catalog-art" aria-hidden="true" /><div><p className="eyebrow">Saved {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(savedAt))}</p><h2>{candidate.title}</h2><p className="saved-meta">{candidate.type} · {candidate.sourceFamily} · {Math.round(candidate.confidence * 100)}% source confidence</p><p>{candidate.topics.join(" · ") || "Source-backed discovery"}</p><p className="saved-reason"><ShieldCheck size={15} /> An explicit signal you can revisit or correct.</p><Link className="card-evidence-link" href={`/nuru/discover/edition/${candidate.id}`}>Open discovery <ArrowRight size={14} /></Link></div></article>)}</section>
  </main>;
}
