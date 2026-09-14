"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Compass,
  Dice5,
  Lightbulb,
  Map,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { discoveries, tasteMap, type NuruAction, type NuruPreferenceState } from "@/src/nuru/dashboard";
import "./nuru.css";

export default function NuruPage() {
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [noticeAcknowledged, setNoticeAcknowledged] = useState(false);
  const [displayDiscoveries, setDisplayDiscoveries] = useState<Array<{ id: string; kind: string; title: string; meta: string; score: number; image: string }>>(discoveries);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const act = (label: string) => setMessage(`${label} is ready for your next visit.`);
  const applyAction = async (action: NuruAction) => {
    const response = await fetch("/api/nuru/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(action),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setMessage(payload.error?.message ?? "Nuru couldn’t save that preference.");
      return;
    }
    const preferences = payload.data.preferences as NuruPreferenceState;
    setSaved(preferences.savedDiscoveryIds.includes("billion-dollar-spy"));
    setDismissed(preferences.dismissedDiscoveryIds.includes("billion-dollar-spy"));
    setNoticeAcknowledged(preferences.noticeFeedback !== null);
  };

  useEffect(() => {
    void fetch("/api/nuru/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.ok) return;
        const preferences = payload.data.preferences as NuruPreferenceState;
        if (Array.isArray(payload.data.discoveries)) setDisplayDiscoveries(payload.data.discoveries);
        setSaved(preferences.savedDiscoveryIds.includes("billion-dollar-spy"));
        setDismissed(preferences.dismissedDiscoveryIds.includes("billion-dollar-spy"));
        setNoticeAcknowledged(preferences.noticeFeedback !== null);
      })
      .catch(() => undefined);
  }, []);

  return (
    <main className="nuru-shell">
      <header className="nuru-nav">
        <a className="nuru-brand" href="#top" aria-label="Nuru home">
          <span>NURU</span><small>Discover a deeper world</small>
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#top">Discover</a>
          <Link href="/nuru/rabbit-holes/race-for-supersonic-flight">Rabbit Holes</Link>
          <Link href="/nuru/collection">Saved</Link>
          <Link href="/nuru/taste-map">Taste Map</Link>
        </nav>
        <label className="nuru-search">
          <Search size={17} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for anything..." aria-label="Search discoveries" />
        </label>
        <button className="profile" onClick={() => act("Your profile")}>JD</button>
      </header>

      <section className="nuru-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Good morning.</p>
          <h1>I found 7 things<br />for you.</h1>
          <p className="hero-detail">3 strong matches · 2 adjacent · 1 serendipity · 1 wildcard</p>
          <blockquote>“A more curious you,<br />a richer world.” <span>— NURU</span></blockquote>
        </div>
        <p className="hero-manifesto">Ideas<br />People<br />Places<br />Stories<br /><b>Beyond</b><small> the obvious</small></p>
      </section>

      <section className="featured" aria-labelledby="featured-title">
        <div className="featured-copy">
          <p className="eyebrow"><Sparkles size={16} fill="currentColor" /> Featured discovery</p>
          <h2 id="featured-title">The Billion Dollar Spy</h2>
          <p className="muted">Book · David E. Hoffman · 2015</p>
          <p className="description">The extraordinary true story of an engineer who became the most valuable spy in history, as technology, politics and ambition collided during the final years of the Cold War.</p>
          <div className="featured-actions">
            <Link className="gold-button" href="/nuru/discoveries/billion-dollar-spy"><span>Explore</span><ArrowRight size={16} /></Link>
            <button className={`quiet-button ${saved ? "selected" : ""}`} onClick={() => void applyAction({ type: "save-discovery", discoveryId: "billion-dollar-spy" })}><Bookmark size={18} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}</button>
            <button className={`quiet-button ${dismissed ? "selected" : ""}`} onClick={() => void applyAction({ type: "dismiss-discovery", discoveryId: "billion-dollar-spy" })}><X size={18} /> {dismissed ? "We’ll adjust" : "Not for me"}</button>
          </div>
        </div>
        <div className="featured-art" role="img" aria-label="Silhouette of a man walking through a rainy Cold War era city" />
        <aside className="featured-reason">
          <span className="reason-tag">Near certain match</span>
          <div className="score-ring"><strong>86%</strong><small>match</small></div>
          <div className="reason-block"><h3>Why Nuru chose this</h3><p>You’ve repeatedly explored stories combining engineering, historical turning points, competition and unusual personalities. This has all four.</p></div>
          <div className="reason-block"><h3>The unexpected connection</h3><p>This isn’t primarily an engineering story. The connection is how an engineering constraint fundamentally changed a political decision.</p></div>
        </aside>
      </section>

      <section className="section discoveries" aria-labelledby="discoveries-title">
        <div className="section-heading"><h2 id="discoveries-title">Today’s discoveries</h2><button onClick={() => act("All seven discoveries")}>View all 7 <ArrowRight size={15} /></button></div>
        <div className="discovery-grid">
          {displayDiscoveries.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())).map((item) => (
            <Link className="discovery-card" key={item.title} href={`/nuru/discoveries/${item.id}`}>
              <div className={`card-art ${item.image.startsWith("http") ? "" : item.image}`} style={item.image.startsWith("http") ? { backgroundImage: `url(${item.image})` } : undefined}><span><Sparkles size={12} fill="currentColor" /> {item.kind}</span></div>
              <div className="card-body"><h3>{item.title}</h3><p>{item.meta}</p><b>{item.score}%</b></div>
            </Link>
          ))}
        </div>
        {search && !displayDiscoveries.some((item) => item.title.toLowerCase().includes(search.toLowerCase())) && <p className="empty-state">Nothing in today’s collection matches “{search}”.</p>}
      </section>

      <section className="section curiosity-actions" aria-labelledby="curiosity-title">
        <div className="section-heading"><h2 id="curiosity-title">Follow your curiosity</h2><span>Different paths. A richer you.</span></div>
        <div className="action-grid">
          <button onClick={() => act("A surprising discovery")}><Dice5 /><span><b>Surprise me</b><small>One unexpected discovery.</small></span></button>
          <button onClick={() => act("A new rabbit hole")}><Compass /><span><b>Rabbit hole</b><small>Build an exploration journey.</small></span></button>
          <button onClick={() => act("A deeper discovery")}><Sparkles /><span><b>Go deeper</b><small>More like what I enjoy.</small></span></button>
          <button onClick={() => act("A fresh perspective")}><Map /><span><b>Take me somewhere new</b><small>Outside my usual interests.</small></span></button>
        </div>
      </section>

      <section className="insights-row">
        <article className="taste-map" id="taste-map"><div className="section-heading"><div><h2>Your curiosity</h2><p>Top interest patterns</p></div><Link href="/nuru/taste-map">View Taste Map <ArrowRight size={15} /></Link></div>{tasteMap.map((item) => <div className="meter" key={item.label}><span>{item.label}</span><i><b style={{ width: `${item.score}%` }} /></i><em>{item.score}%</em></div>)}</article>
        <article className="notice"><p className="eyebrow"><Lightbulb size={17} /> Nuru noticed something</p>{noticeAcknowledged ? <><h2>Thank you for the signal.</h2><p>We’ll use it gently—not as a rule, just a possibility to keep exploring.</p></> : <><h2>Your interest in aviation appears to be shifting.</h2><p>You’re spending less time exploring aircraft themselves and more time exploring the economics and politics surrounding them.</p><div><button className="gold-button" onClick={() => void applyAction({ type: "notice-feedback", value: "explore" })}>Explore this</button><button className="quiet-button" onClick={() => void applyAction({ type: "notice-feedback", value: "not-really" })}>Not really</button></div></>}</article>
        <article className="rabbit-hole" id="rabbit-hole"><p className="eyebrow"><Compass size={16} /> Continue exploring</p><div className="rabbit-art" /><h2>The Race for Supersonic Flight</h2><p>Concorde → Cold War aerospace → the sonic boom problem</p><div className="progress"><span>Progress 4 / 7</span><i><b /></i><Link href="/nuru/rabbit-holes/race-for-supersonic-flight">Continue <ArrowRight size={14} /></Link></div></article>
      </section>

      <section className="collection" id="collection"><p className="eyebrow">Your private museum</p><h2>Things worth returning to—not another feed.</h2><Link href="/nuru/collection" className="collection-link">Open your collection <ArrowRight size={15} /></Link></section>
      <footer><span>NURU <small>A more curious world</small></span><p>You’re not just consuming.<br /><b>You’re discovering.</b></p><small>Knowledge builds a richer you.</small></footer>
      {message && <div className="toast" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button></div>}
    </main>
  );
}
