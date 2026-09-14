"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Circle, Compass, Sparkles } from "lucide-react";
import type { NuruRabbitHole } from "@/src/nuru/dashboard";
import "../../nuru.css";

type JourneyState = { rabbitHole: NuruRabbitHole; completedSteps: string[] };

export function RabbitHoleJourney({ rabbitHoleId }: Readonly<{ rabbitHoleId: string }>) {
  const [journey, setJourney] = useState<JourneyState | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch(`/api/nuru/rabbit-holes/${encodeURIComponent(rabbitHoleId)}`, { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (response.ok && payload.ok && payload.data) setJourney(payload.data as JourneyState);
        else setError(payload.error?.message ?? "Nuru couldn’t find that Rabbit Hole.");
      })
      .catch(() => setError("Nuru couldn’t find that Rabbit Hole."));
  }, [rabbitHoleId]);

  async function toggleStep(stepId: string) {
    const response = await fetch(`/api/nuru/rabbit-holes/${encodeURIComponent(rabbitHoleId)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "toggle-step", stepId }) });
    const payload = await response.json();
    if (response.ok && payload.ok) setJourney(payload.data as JourneyState);
    else setError(payload.error?.message ?? "Nuru couldn’t update that step.");
  }

  if (error) return <main className="nuru-shell journey-shell"><div className="journey-error"><Compass /><h1>That path is not available.</h1><p>{error}</p><Link className="gold-button" href="/nuru">Return to today’s discoveries</Link></div></main>;
  if (!journey) return <main className="nuru-shell journey-shell"><div className="journey-error">Opening a path through the unfamiliar…</div></main>;
  const { rabbitHole, completedSteps } = journey;
  const nextStep = rabbitHole.steps.find((step) => !completedSteps.includes(step.id));
  const progress = Math.round((completedSteps.length / rabbitHole.steps.length) * 100);

  return <main className="nuru-shell journey-shell">
    <header className="nuru-nav"><Link className="nuru-brand" href="/nuru"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru">Discover</Link><Link className="active" href={`/nuru/rabbit-holes/${rabbitHole.id}`}>Rabbit Holes</Link><Link href="/nuru/collection">Saved</Link><Link href="/nuru/taste-map">Taste Map</Link></nav></header>
    <section className="journey-hero"><div className="journey-cover" /><div><Link href="/nuru" className="back-link"><ArrowLeft size={15} /> Today’s discoveries</Link><p className="eyebrow"><Compass size={16} /> Rabbit hole · A guided path</p><h1>{rabbitHole.title}</h1><p>{rabbitHole.subtitle}</p><div className="journey-progress"><span>{completedSteps.length} of {rabbitHole.steps.length} explored</span><i><b style={{ width: `${progress}%` }} /></i><em>{progress}%</em></div></div></section>
    <section className="journey-intro"><div><p className="eyebrow"><Sparkles size={15} /> Follow a question, not a feed</p><h2>Move at your own pace. Each stop gives the next one a little more meaning.</h2></div>{nextStep && <button className="gold-button" onClick={() => void toggleStep(nextStep.id)}>Mark “{nextStep.title}” explored <Check size={15} /></button>}</section>
    <ol className="journey-steps">{rabbitHole.steps.map((step) => { const isComplete = completedSteps.includes(step.id); return <li key={step.id} className={isComplete ? "complete" : ""}><button onClick={() => void toggleStep(step.id)} aria-label={`${isComplete ? "Mark incomplete" : "Mark complete"}: ${step.title}`}><span>{isComplete ? <Check size={16} /> : <Circle size={16} />}</span></button><div><p>Stop {step.position}</p><h3>{step.title}</h3><p>{step.description}</p></div>{isComplete && <small>Explored</small>}</li>; })}</ol>
    <footer><span>NURU <small>A more curious world</small></span><p>You’re not just consuming.<br /><b>You’re discovering.</b></p><small>Knowledge builds a richer you.</small></footer>
  </main>;
}
