"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, EyeOff, Map as MapIcon, Sparkles } from "lucide-react";
import { tasteMapNodes, type TasteMapAction } from "@/src/nuru/dashboard";
import "../nuru.css";

type TasteSignal = { nodeId: (typeof tasteMapNodes)[number]["id"]; label: string; cluster: string; score: number; isActive: boolean; confirmedAt: string | null };

export function TasteMap() {
  const [signals, setSignals] = useState<TasteSignal[] | null>(null);
  const [selectedId, setSelectedId] = useState("technology-turning-points");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/nuru/taste-map", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (response.ok && payload.ok) setSignals(payload.data as TasteSignal[]);
        else setMessage(payload.error?.message ?? "Nuru couldn’t open your Taste Map.");
      })
      .catch(() => setMessage("Nuru couldn’t open your Taste Map."));
  }, []);

  const selected = signals?.find((signal) => signal.nodeId === selectedId) ?? signals?.[0];
  const nodePosition = new Map(tasteMapNodes.map((node) => [node.id, node]));

  async function act(action: TasteMapAction) {
    const response = await fetch("/api/nuru/taste-map", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(action) });
    const payload = await response.json();
    if (response.ok && payload.ok) setSignals(payload.data as TasteSignal[]);
    else setMessage(payload.error?.message ?? "Nuru couldn’t update that signal.");
  }

  return <main className="nuru-shell taste-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru">Discover</Link><Link href="/nuru/rabbit-holes/race-for-supersonic-flight">Rabbit Holes</Link><Link href="/nuru/collection">Saved</Link><Link className="active" href="/nuru/taste-map">Taste Map</Link></nav></header>
    <section className="taste-hero"><Link href="/nuru" className="back-link"><ArrowLeft size={15} /> Today’s discoveries</Link><p className="eyebrow"><MapIcon size={16} /> Your curiosity, in motion</p><h1>Your Taste Map</h1><p>This is Nuru’s current sketch of what keeps your attention. It changes slowly—and only with your help.</p></section>
    <section className="taste-layout">
      <div className="taste-canvas" aria-label="Interactive map of your curiosity patterns">{signals?.map((signal) => { const position = nodePosition.get(signal.nodeId); if (!position) return null; return <button key={signal.nodeId} className={`taste-node ${selected?.nodeId === signal.nodeId ? "selected" : ""} ${signal.isActive ? "" : "quiet"}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={() => setSelectedId(signal.nodeId)}><span>{signal.score}%</span><b>{signal.label}</b></button>; })}<i className="taste-line line-one" /><i className="taste-line line-two" /><i className="taste-line line-three" /><i className="taste-line line-four" />{!signals && <p className="taste-loading">Mapping the patterns you’ve been following…</p>}</div>
      <aside className="taste-detail">{selected ? <><p className="eyebrow"><Sparkles size={15} /> {selected.cluster}</p><h2>{selected.label}</h2><div className="taste-score"><strong>{selected.score}%</strong><span>current strength</span></div><p>{selected.isActive ? `Nuru sees this as a meaningful part of your curiosity. ${selected.confirmedAt ? "You’ve confirmed it, so we’ll hold it with a little more confidence." : "Does this still feel true?"}` : "You asked Nuru to hold this more lightly. It won’t disappear—it just won’t steer your discoveries for now."}</p><div className="taste-actions"><button className="gold-button" onClick={() => void act({ type: "confirm", nodeId: selected.nodeId })}><Check size={16} /> Yes, this fits</button><button className="quiet-button" onClick={() => void act({ type: "quiet", nodeId: selected.nodeId })}><EyeOff size={16} /> Less of this</button></div></> : <p>Choose a point to learn what Nuru sees.</p>}</aside>
    </section>
    <section className="taste-note"><p className="eyebrow">A gentle model, not a verdict</p><p>Nuru learns from what you linger on, save, dismiss, and return to. You can always correct the map.</p></section>
    <footer><span>NURU <small>A more curious world</small></span><p>You’re not just consuming.<br /><b>You’re discovering.</b></p><small>Knowledge builds a richer you.</small></footer>
    {message && <div className="toast" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button></div>}
  </main>;
}
