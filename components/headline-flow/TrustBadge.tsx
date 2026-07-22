"use client";

import { ShieldCheck, ShieldQuestion, ShieldAlert } from "lucide-react";
import type { Headline } from "@/types/headline";

export function TrustBadge({ story }: { story: Headline }) {
  if (!story.trust) return null;
  const tone =
    story.trust.trustStanding === "NOMINAL"
      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-50"
      : story.trust.trustStanding === "DEGRADED"
        ? "border-amber-300/25 bg-amber-300/10 text-amber-50"
        : "border-slate-300/20 bg-white/6 text-slate-100";
  const Icon = story.trust.trustStanding === "NOMINAL" ? ShieldCheck : story.trust.trustStanding === "DEGRADED" ? ShieldAlert : ShieldQuestion;

  return (
    <details className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          Trust {story.trust.trustStanding}
        </span>
        <span>{story.trust.confidence}%</span>
      </summary>
      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
        <p>{story.trust.explanation}</p>
        <p>Evidence: {story.trust.evidenceCount} signals. Source reputation: {story.trust.sourceReputation}. Risk: {story.trust.misinformationRisk}.</p>
        <div>
          <p className="font-semibold text-white">Trust history</p>
          {story.trust.history.map((item) => (
            <p key={`${item.at}-${item.reason}`} className="text-xs text-slate-300">
              {item.standing} · {item.reason}
            </p>
          ))}
        </div>
      </div>
    </details>
  );
}
