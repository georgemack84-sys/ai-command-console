"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Compass, Plus } from "lucide-react";
import "../../nuru.css";

type Preferences = { topics: string[]; availableTopics: string[] };

export default function NuruDiscoverInterestsPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/nuru/discover/preferences", { cache: "no-store" }).then(async (response) => {
      const body = await response.json() as { ok: boolean; data?: Preferences; error?: { message?: string } };
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to load interests.");
      setPreferences(body.data);
      setSelected(body.data.topics);
    }).catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : "Unable to load interests."));
  }, []);

  function toggle(topic: string) {
    setSelected((current) => current.includes(topic) ? current.filter((entry) => entry !== topic) : [...current, topic].slice(0, 20));
  }

  function addCustomTopic() {
    const topic = customTopic.trim();
    if (!topic) return;
    setSelected((current) => current.includes(topic) ? current : [...current, topic].slice(0, 20));
    setCustomTopic("");
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/nuru/discover/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topics: selected }),
      });
      const body = await response.json() as { ok: boolean; data?: { topics: string[] }; error?: { message?: string } };
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to save interests.");
      setSelected(body.data.topics);
      setMessage("Your explicit interests are saved. Discover will use them in its explainable ranking.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save interests.");
    } finally {
      setBusy(false);
    }
  }

  const availableTopics = preferences?.availableTopics ?? [];
  return <main className="nuru-shell interests-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/discover">Discover</Link><Link className="active" href="/nuru/discover/interests">Interests</Link><Link href="/nuru/discover/saved">Saved</Link><Link href="/nuru/discover/taste-map">Taste Map</Link></nav></header>
    <section className="interests-hero"><Link className="back-link" href="/nuru/discover"><ArrowLeft size={16} /> Back to Discover</Link><p className="eyebrow"><Compass size={16} /> Your explicit preferences</p><h1>What are you curious about?</h1><p>Select topics Nuru may use to rank the admitted catalog. These are visible, editable choices—not inferred traits or permanent labels.</p></section>
    <section className="interests-card">{preferences === null && !message && <p>Loading topics…</p>}{preferences && <><p className="eyebrow">Catalog topics</p><div className="interest-chips">{availableTopics.map((topic) => <button type="button" key={topic} className={selected.includes(topic) ? "selected" : ""} onClick={() => toggle(topic)}>{selected.includes(topic) && <Check size={14} />}{topic}</button>)}{!availableTopics.length && <p>The catalog has no topic labels yet. You can add your own below.</p>}</div><label className="custom-interest">Add a topic <div><input value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomTopic(); } }} placeholder="e.g. systems design" /><button type="button" onClick={addCustomTopic}><Plus size={16} /> Add</button></div></label>{selected.some((topic) => !availableTopics.includes(topic)) && <div className="selected-interests"><p className="eyebrow">Your added topics</p>{selected.filter((topic) => !availableTopics.includes(topic)).map((topic) => <button key={topic} type="button" onClick={() => toggle(topic)}>{topic} ×</button>)}</div>}<div className="interest-actions"><button className="gold-button" disabled={busy} onClick={() => void save()}>Save interests</button><Link className="quiet-button" href="/nuru/discover">Skip for now</Link></div></>}{message && <p role="status" className="interest-message">{message}</p>}</section>
  </main>;
}
