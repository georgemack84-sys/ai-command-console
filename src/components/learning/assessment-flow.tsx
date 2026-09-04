"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

const targetSkillId = "linux.systemd.troubleshooting";
type Session = { id: string; state: string };
type Item = { id: string; evaluation_type: string; prompt: string; expected_response_format: string; difficulty: number };
type Progress = { state: "CONTINUE" | "READY_TO_COMPLETE"; reason: string; covered_competencies: string[]; insufficient_competencies: string[] };
type Profile = { knowledge: number | null; application: number | null; troubleshooting: number | null; retention: number | null; calibration: number | null; score: number | null; confidence_interval: { lower: number; upper: number }; evidence_count: number };
type Recommendation = { instructional_starting_point: string; priority_gaps: { competency: string; reason: string }[]; retest_at?: string };
type SessionPayload = { session: Session; items: Item[]; progress: Progress };

const percent = (value: number | null) => value === null ? "Insufficient evidence" : `${Math.round(value * 100)}%`;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error?.message ?? "Assessment request failed.");
  return payload.data as T;
}

export function AssessmentFlow() {
  const [session, setSession] = useState<Session | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState("0.5");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = async (sessionId: string) => {
    const data = await request<SessionPayload>(`/api/learning/assessments/${encodeURIComponent(sessionId)}`);
    setSession(data.session); setItem(data.items[0] ?? null); setProgress(data.progress); setAnswer("");
  };
  const start = async () => { setBusy(true); setError(null); try { const data = await request<{ session: Session }>("/api/learning/assessments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ skill_id: targetSkillId }) }); await loadSession(data.session.id); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to start assessment."); } finally { setBusy(false); } };
  const submit = async () => { if (!session || !item || !answer.trim()) return; setBusy(true); setError(null); try { await request(`/api/learning/assessments/${encodeURIComponent(session.id)}/responses`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ item_id: item.id, answer, self_rated_confidence: Number(confidence) }) }); await loadSession(session.id); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save response."); } finally { setBusy(false); } };
  const complete = async () => { if (!session) return; setBusy(true); setError(null); try { await request(`/api/learning/assessments/${encodeURIComponent(session.id)}/complete`, { method: "POST" }); const [profileData, recommendationData] = await Promise.all([request<{ profile: Profile }>(`/api/learning/competency-profile?skill_id=${encodeURIComponent(targetSkillId)}`), request<{ recommendation: Recommendation }>(`/api/learning/assessment-recommendation?session_id=${encodeURIComponent(session.id)}`)]); setProfile(profileData.profile); setRecommendation(recommendationData.recommendation); setItem(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to complete assessment."); } finally { setBusy(false); } };

  return <Card id="systemd-diagnostic">
    <CardHeader><CardTitle>Systemd diagnostic</CardTitle><CardDescription>Answer each adaptive prompt in your own words. Your confidence rating helps calibrate the result.</CardDescription></CardHeader>
    <CardContent className="space-y-5">
      {!session && <Button onClick={start} disabled={busy}>{busy ? "Starting…" : "Start diagnostic"}</Button>}
      {item && <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-[0.18em] text-sky-200">{item.evaluation_type.replaceAll("_", " ")} · difficulty {item.difficulty}/5</p><p className="text-xs text-slate-400">Adaptive next step</p></div><p className="font-medium text-white">{item.prompt}</p><textarea aria-label="Assessment answer" value={answer} onChange={(event) => setAnswer(event.target.value)} className="min-h-28 w-full rounded-xl border border-white/15 bg-slate-950/50 p-3 text-sm text-white outline-none focus:border-sky-300" placeholder={`Respond in ${item.expected_response_format.replaceAll("_", " ")}.`} /><label className="block text-sm text-slate-300">How confident are you? <select aria-label="Response confidence" value={confidence} onChange={(event) => setConfidence(event.target.value)} className="ml-2 rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-white"><option value="0.25">Low</option><option value="0.5">Moderate</option><option value="0.75">High</option><option value="1">Very high</option></select></label><Button onClick={submit} disabled={busy || !answer.trim()}>{busy ? "Saving…" : "Save answer"}</Button></div>}
      {session && !item && progress?.state === "READY_TO_COMPLETE" && !profile && <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 p-4"><p className="font-medium text-sky-100">Ready to complete</p><p className="mt-1 text-sm text-sky-100/80">{progress.reason}</p><Button className="mt-4" onClick={complete} disabled={busy}>{busy ? "Calculating…" : "View my profile"}</Button></div>}
      {progress && !profile && <p className="text-sm text-slate-400">Evidence captured: {progress.covered_competencies.join(", ") || "none yet"}. {progress.insufficient_competencies.length ? `Still needed: ${progress.insufficient_competencies.join(", ")}.` : ""}</p>}
      {profile && <div className="space-y-4"><div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Competency profile</p><p className="mt-1 text-2xl font-semibold text-white">Overall {percent(profile.score)}</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Knowledge", profile.knowledge], ["Application", profile.application], ["Troubleshooting", profile.troubleshooting], ["Retention", profile.retention], ["Calibration", profile.calibration]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-1 font-medium text-white">{percent(value as number | null)}</p></div>)}</div><p className="text-sm text-slate-400">Confidence interval: {Math.round(profile.confidence_interval.lower * 100)}–{Math.round(profile.confidence_interval.upper * 100)}% from {profile.evidence_count} responses.</p></div>}
      {recommendation && <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4"><p className="font-medium text-amber-50">Recommended starting point: {recommendation.instructional_starting_point}</p>{recommendation.priority_gaps.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-50/80">{recommendation.priority_gaps.map((gap) => <li key={gap.competency}>{gap.reason}</li>)}</ul> : <p className="mt-1 text-sm text-amber-50/80">The diagnostic found no priority gaps. Keep practicing realistic service failures.</p>}{recommendation.retest_at && <p className="mt-3 text-sm text-amber-50/80">Suggested retest: {new Date(recommendation.retest_at).toLocaleDateString()}.</p>}</div>}
      {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
    </CardContent>
  </Card>;
}
