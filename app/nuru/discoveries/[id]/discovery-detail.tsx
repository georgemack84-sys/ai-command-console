"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Compass, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { NuruAction, NuruDiscoveryDetail, NuruPreferenceState } from "@/src/nuru/dashboard";
import "../../nuru.css";

export function DiscoveryDetail({ discovery }: Readonly<{ discovery: NuruDiscoveryDetail }>) {
  const [preferences, setPreferences] = useState<NuruPreferenceState | null>(null);
  const [message, setMessage] = useState("");
  const saved = preferences?.savedDiscoveryIds.includes(discovery.id) ?? false;
  const dismissed = preferences?.dismissedDiscoveryIds.includes(discovery.id) ?? false;
  const affinity = preferences?.affinities[discovery.id];

  useEffect(() => {
    void fetch("/api/nuru/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => payload.ok && setPreferences(payload.data.preferences as NuruPreferenceState))
      .catch(() => undefined);
  }, []);

  async function applyAction(action: NuruAction) {
    const response = await fetch("/api/nuru/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(action) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) return setMessage(payload.error?.message ?? "Nuru couldn’t save that preference.");
    setPreferences(payload.data.preferences as NuruPreferenceState);
  }

  return <main className="nuru-shell detail-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link className="active" href="/nuru">Discover</Link><Link href="/nuru/rabbit-holes/race-for-supersonic-flight">Rabbit Holes</Link><Link href="/nuru/collection">Saved</Link><Link href="/nuru/taste-map">Taste Map</Link></nav></header>
    <section className="detail-hero">
      <div className={`detail-art ${discovery.image}`} role="img" aria-label="Editorial artwork for the selected discovery" />
      <div className="detail-title"><Link href="/nuru" className="back-link"><ArrowLeft size={15} /> Today’s discoveries</Link><p className="eyebrow"><Sparkles size={15} fill="currentColor" /> {discovery.kind}</p><h1>{discovery.title}</h1><p className="detail-meta">{discovery.meta} <span>·</span> {discovery.score}% Nuru match</p><p>{discovery.eyebrow}</p></div>
    </section>
    <section className="detail-grid">
      <article className="detail-story"><p className="eyebrow">Why this is worth your time</p><p className="lede">{discovery.summary}</p><div className="detail-actions"><button className={`quiet-button ${saved ? "selected" : ""}`} onClick={() => void applyAction({ type: "save-discovery", discoveryId: discovery.id })}><Bookmark size={18} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved to your collection" : "Save to collection"}</button><button className={`quiet-button ${dismissed ? "selected" : ""}`} onClick={() => void applyAction({ type: "dismiss-discovery", discoveryId: discovery.id })}><X size={18} /> {dismissed ? "We’ll tune this" : "Not for me"}</button></div><div className="affinity-feedback"><span>Should Nuru look for more discoveries like this?</span><button className={affinity === "more" ? "selected" : ""} onClick={() => void applyAction({ type: "set-affinity", discoveryId: discovery.id, value: "more" })}><ThumbsUp size={15} /> More like this</button><button className={affinity === "less" ? "selected" : ""} onClick={() => void applyAction({ type: "set-affinity", discoveryId: discovery.id, value: "less" })}><ThumbsDown size={15} /> Less like this</button></div></article>
      <aside className="detail-reasons"><div><p className="eyebrow">Why Nuru chose this</p><p>{discovery.reason}</p></div><div><p className="eyebrow">The unexpected connection</p><p>{discovery.connection}</p></div></aside>
    </section>
    <section className="path-section"><div><p className="eyebrow"><Compass size={16} /> Where this could lead</p><h2>Continue with a thread that caught your attention.</h2></div><div className="path-list">{discovery.paths.map((path, index) => <button key={path} onClick={() => setMessage(`${path} is being prepared as your next Nuru path.`)}><span>0{index + 1}</span>{path}<ArrowRight size={16} /></button>)}</div></section>
    <footer><span>NURU <small>A more curious world</small></span><p>You’re not just consuming.<br /><b>You’re discovering.</b></p><small>Knowledge builds a richer you.</small></footer>
    {message && <div className="toast" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button></div>}
  </main>;
}
