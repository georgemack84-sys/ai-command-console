"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import "../../nuru.css";

type Prompt = { id: string; question: string; hint: string };
type Interview = { prompts: Prompt[]; answers: Array<{ promptId: string; answer: string }> };

export default function NuruDiscoverOnboardingPage() {
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void fetch("/api/nuru/discover/onboarding", { cache: "no-store" }).then(async (response) => { const body = await response.json() as { ok: boolean; data?: Interview; error?: { message?: string } }; if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? "Unable to begin the Taste Interview."); setInterview(body.data); setAnswers(Object.fromEntries(body.data.answers.map((answer) => [answer.promptId, answer.answer]))); }).catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : "Unable to begin the Taste Interview.")); }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!interview) return; setBusy(true); setMessage(null); try { const response = await fetch("/api/nuru/discover/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers: interview.prompts.map((prompt) => ({ promptId: prompt.id, answer: answers[prompt.id] ?? "" })) }) }); const body = await response.json() as { ok: boolean; error?: { message?: string } }; if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Unable to save your interview."); router.push("/nuru/discover/taste-map"); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Unable to save your interview."); } finally { setBusy(false); } }
  return <main className="nuru-shell onboarding-shell"><header className="nuru-nav"><Link className="nuru-brand" href="/nuru/discover"><span>NURU</span><small>Discover a deeper world</small></Link><nav aria-label="Primary navigation"><Link href="/nuru/discover">Discover</Link><Link className="active" href="/nuru/discover/onboarding">Taste Interview</Link><Link href="/nuru/discover/taste-map">Taste Map</Link></nav></header><section className="onboarding-hero"><p className="eyebrow"><Sparkles size={16} /> First, a little curiosity</p><h1>Tell Nuru what<br />draws you in.</h1><p>There are no categories to pick and no permanent labels. Your answers become tentative evidence that you can always inspect or correct.</p></section>{interview ? <form className="onboarding-form" onSubmit={submit}>{interview.prompts.map((prompt, index) => <label key={prompt.id}><span>0{index + 1}</span><b>{prompt.question}</b><small>{prompt.hint}</small><textarea required minLength={3} maxLength={1_500} value={answers[prompt.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [prompt.id]: event.target.value }))} /></label>)}<div className="onboarding-actions"><button className="gold-button" disabled={busy}>{busy ? "Nuru is listening…" : <>Create my first Taste Map <ArrowRight size={16} /></>}</button><Link className="quiet-button" href="/nuru/discover">I’ll do this later</Link></div>{message && <p role="status">{message}</p>}</form> : <section className="onboarding-loading"><Compass /><p>{message ?? "Preparing a few thoughtful questions…"}</p></section>}</main>;
}
