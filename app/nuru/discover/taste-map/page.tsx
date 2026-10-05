"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Compass, X } from "lucide-react";
import "../../nuru.css";

type TasteTopic = { topic: string; score: number; savedCount: number; dismissedCount: number; evidenceItemIds: string[] };
type Preferences = { topics: string[]; availableTopics: string[] };
type InterviewSignal = { id: string; concept: string; dimension: string; polarity: number; confidence: number; evidenceCount: number; status: string; source: "INTERVIEW_V1" | "FEEDBACK_V1" };

export default function NuruDiscoverTasteMapPage() {
  const [topics, setTopics] = useState<TasteTopic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [interviewSignals, setInterviewSignals] = useState<InterviewSignal[]>([]);
  const [actingOnSignal, setActingOnSignal] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/nuru/discover/taste-map", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { ok: boolean; data?: TasteTopic[]; error?: { message?: string } };
        if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to load your Taste Map.");
        setTopics(body.data);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load your Taste Map."));
  }, []);

  useEffect(() => {
    void fetch("/api/nuru/discover/taste-signals", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { ok: boolean; data?: InterviewSignal[]; error?: { message?: string } };
        if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to load interview signals.");
        setInterviewSignals(body.data);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load interview signals."));
  }, []);

  useEffect(() => {
    void fetch(`/api/nuru/discover/preferences?map=${Date.now()}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { ok: boolean; data?: Preferences; error?: { message?: string } };
        if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to load your ranking preferences.");
        setPreferences(body.data);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load your ranking preferences."));
  }, []);

  async function removePreference(topic: string) {
    if (!preferences) return;
    setRemoving(topic);
    try {
      const response = await fetch("/api/nuru/discover/preferences", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ topics: preferences.topics.filter((entry) => entry !== topic) }) });
      const body = await response.json() as { ok: boolean; data?: { topics: string[] }; error?: { message?: string } };
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to remove that interest.");
      setPreferences((current) => current ? { ...current, topics: body.data!.topics } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove that interest.");
    } finally {
      setRemoving(null);
    }
  }

  async function actOnInterviewSignal(signalId: string, type: "confirm" | "quiet" | "remove") {
    setActingOnSignal(signalId);
    try {
      const response = await fetch("/api/nuru/discover/taste-signals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ signalId, type }) });
      const body = await response.json() as { ok: boolean; data?: InterviewSignal[]; error?: { message?: string } };
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to update that Taste Map signal.");
      setInterviewSignals(body.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update that Taste Map signal."); }
    finally { setActingOnSignal(null); }
  }

  return <main className="nuru-shell taste-shell"><section className="taste-hero"><Link className="back-link" href="/nuru/discover"><ArrowLeft size={15} /> Back to Discover</Link><p className="eyebrow"><Compass size={16} /> Your controlled profile</p><h1>Taste Map</h1><p>See exactly which choices affect ranking. Nuru holds interview insights lightly until you confirm them with further exploration.</p></section><section className="taste-map-list">{error && <p role="alert">{error}</p>}{interviewSignals.length > 0 && <section className="taste-preferences"><p className="eyebrow">Working hypotheses</p><h2>What Nuru is learning</h2><p>These are tentative candidate signals, based on your interview and feedback—not permanent labels.</p><div className="taste-preference-chips">{interviewSignals.map((signal) => <span key={signal.id}><b>{signal.polarity < 0 ? "Less of " : "Curious about "}{signal.concept}</b><small>{signal.source === "FEEDBACK_V1" ? "Your feedback" : "Taste Interview"} · {signal.dimension.replaceAll("_", " ").toLowerCase()} · {signal.status.toLowerCase()} · {Math.round(signal.confidence * 100)}% confidence</small><i><button type="button" onClick={() => void actOnInterviewSignal(signal.id, "confirm")} disabled={actingOnSignal !== null}>This fits</button><button type="button" onClick={() => void actOnInterviewSignal(signal.id, "quiet")} disabled={actingOnSignal !== null}>Less of this</button><button type="button" onClick={() => void actOnInterviewSignal(signal.id, "remove")} disabled={actingOnSignal !== null}>Remove</button></i></span>)}</div></section>}{preferences && <section className="taste-preferences"><p className="eyebrow">Explicit evidence</p><h2>Topics you chose</h2><p>These are one kind of Taste Map evidence, alongside your interview and feedback.</p>{preferences.topics.length ? <div className="taste-preference-chips">{preferences.topics.map((topic) => <button key={topic} type="button" onClick={() => void removePreference(topic)} disabled={removing !== null} aria-label={`Remove ${topic} from ranking`}><span>{topic}</span><small>Explicit choice · +15</small><X size={14} aria-hidden="true" /></button>)}</div> : <div className="taste-preference-empty"><p>No topics are currently shaping rank order.</p><Link className="gold-button" href="/nuru/discover/interests">Choose interests</Link></div>}</section>}{topics === null && !error && <p>Loading your explicit signals…</p>}{topics?.length === 0 && interviewSignals.length === 0 && <div className="taste-empty"><Compass size={30} /><h2>Your feedback story begins with a choice.</h2><p>Take the Taste Interview, or save and dismiss discoveries, to give Nuru something visible and reversible to learn from.</p><Link className="gold-button" href="/nuru/discover/onboarding">Begin the Taste Interview</Link></div>}{topics?.map((topic) => <article key={topic.topic}><div><p className="eyebrow">{topic.score > 0 ? "Positive signal" : topic.score < 0 ? "Less of this" : "Balanced"}</p><h2>{topic.topic}</h2><p>{topic.savedCount} save{topic.savedCount === 1 ? "" : "s"} · {topic.dismissedCount} dismissal{topic.dismissedCount === 1 ? "" : "s"}</p></div><div className="taste-evidence"><b>{topic.score > 0 ? "+" : ""}{topic.score}</b><small>feedback score</small><p>Based on {topic.evidenceItemIds.length} catalog item{topic.evidenceItemIds.length === 1 ? "" : "s"}.</p></div></article>)}</section></main>;
}
