"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, LibraryBig, X } from "lucide-react";
import type { NuruAction, NuruPreferenceState } from "@/src/nuru/dashboard";
import "../nuru.css";

type CollectionItem = { id: string; title: string; meta: string; score: number; image: string; kind: string };

export function NuruCollection() {
  const [items, setItems] = useState<CollectionItem[] | null>(null);
  const [message, setMessage] = useState("");
  const groupedItems = (items ?? []).reduce<Record<string, CollectionItem[]>>((groups, item) => {
    const category = item.meta.split(" · ")[0] ?? "Other";
    (groups[category] ??= []).push(item);
    return groups;
  }, {});

  useEffect(() => {
    void fetch("/api/nuru/collection", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (response.ok && payload.ok) setItems(payload.data as CollectionItem[]);
        else setMessage(payload.error?.message ?? "Nuru couldn’t open your collection.");
      })
      .catch(() => setMessage("Nuru couldn’t open your collection."));
  }, []);

  async function remove(discoveryId: string) {
    const response = await fetch("/api/nuru/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "save-discovery", discoveryId } satisfies NuruAction) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) return setMessage(payload.error?.message ?? "Nuru couldn’t update your collection.");
    const preferences = payload.data.preferences as NuruPreferenceState;
    setItems((current) => current?.filter((item) => preferences.savedDiscoveryIds.includes(item.id)) ?? current);
  }

  return <main className="nuru-shell collection-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru">Discover</Link><Link href="/nuru/rabbit-holes/race-for-supersonic-flight">Rabbit Holes</Link><Link className="active" href="/nuru/collection">Saved</Link><Link href="/nuru/taste-map">Taste Map</Link></nav></header>
    <section className="museum-hero"><Link href="/nuru" className="back-link"><ArrowLeft size={15} /> Today’s discoveries</Link><p className="eyebrow"><LibraryBig size={16} /> Your private museum</p><h1>Things worth<br />returning to.</h1><p>Saved discoveries are a record of your curiosity—not an inbox, and never an endless feed.</p></section>
    <section className="museum-content" aria-live="polite">
      <div className="museum-heading"><div><h2>Your collection</h2><p>{items === null ? "Opening your museum…" : `${items.length} ${items.length === 1 ? "discovery" : "discoveries"} saved`}</p></div><span><Bookmark size={17} fill="currentColor" /> Curated by you</span></div>
      {items === null ? <div className="collection-loading">Gathering the things you chose to keep.</div> : items.length === 0 ? <div className="collection-empty"><Bookmark size={30} /><h2>Your museum is waiting.</h2><p>When something deserves another look, save it here. Nuru will keep it safe without asking for more of your attention.</p><Link className="gold-button" href="/nuru">Discover something <ArrowRight size={16} /></Link></div> : <div className="museum-groups">{Object.entries(groupedItems).map(([category, categoryItems]) => <section key={category}><h3 className="museum-category">{categoryItems.length} {category}{categoryItems.length > 1 ? "s" : ""}</h3><div className="museum-grid">{categoryItems.map((item) => <article className="museum-card" key={item.id}><Link href={`/nuru/discoveries/${item.id}`} className={`museum-art ${item.image}`} aria-label={`Open ${item.title}`}><span>{item.kind}</span></Link><div><p>{item.meta}</p><h3>{item.title}</h3><span>{item.score}% Nuru match</span></div><button onClick={() => void remove(item.id)} aria-label={`Remove ${item.title} from collection`}><X size={16} /> Remove</button></article>)}</div></section>)}</div>}
    </section>
    <footer><span>NURU <small>A more curious world</small></span><p>You’re not just consuming.<br /><b>You’re discovering.</b></p><small>Knowledge builds a richer you.</small></footer>
    {message && <div className="toast" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button></div>}
  </main>;
}
