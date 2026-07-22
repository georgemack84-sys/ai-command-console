"use client";

import { Bookmark, BookmarkCheck, EyeOff, ExternalLink, Radio, Volume2, VolumeX } from "lucide-react";
import { CategoryFallback } from "@/components/headline-flow/CategoryFallback";
import { SourceIdentity } from "@/components/headline-flow/SourceIdentity";
import { TrustBadge } from "@/components/headline-flow/TrustBadge";
import { useHeadlineNarration } from "@/hooks/useHeadlineNarration";
import { composeHeadlineVideo } from "@/lib/news/video/composeHeadlineVideo";
import { relativeTime } from "@/lib/utils/dates";
import type { Headline } from "@/types/headline";

export function HeadlineTvSlide({
  story,
  index,
  total,
  progress,
  playing,
  showTimestamp,
  showCredit,
  onToggleSave,
  onHide,
}: {
  story: Headline;
  index: number;
  total: number;
  progress: number;
  playing: boolean;
  showTimestamp: boolean;
  showCredit: boolean;
  onToggleSave: () => void;
  onHide: () => void;
}) {
  const composition = composeHeadlineVideo(story);
  const elapsedSecond = Math.min(composition.durationSeconds - 0.1, progress * composition.durationSeconds);
  const activeBeat =
    composition.subtitleBeats.find((beat) => elapsedSecond >= beat.startSecond && elapsedSecond < beat.endSecond) ||
    composition.subtitleBeats[0];
  const narration = useHeadlineNarration({
    storyId: story.id,
    script: composition.narrationScript,
    playing,
  });

  return (
    <article
      aria-live="polite"
      className="relative isolate min-h-[min(840px,calc(100vh-180px))] overflow-hidden rounded-[28px] border border-white/12 bg-slate-950 shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
    >
      <div className="absolute inset-0">
        {composition.backgroundUrl ? (
          <img
            src={composition.backgroundUrl}
            alt=""
            className="headline-tv-pan h-full w-full scale-105 object-cover opacity-[0.72]"
            loading="eager"
          />
        ) : (
          <CategoryFallback category={story.category} label={story.visualFallback?.label} />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.88)_0%,rgba(2,6,23,0.54)_44%,rgba(2,6,23,0.14)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(0deg,rgba(2,6,23,0.88),transparent)]" />
      </div>

      <div className="relative z-10 flex min-h-[min(840px,calc(100vh-180px))] flex-col justify-between gap-8 p-5 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-red-300/30 bg-red-500/18 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-100">
              <Radio className="h-4 w-4" aria-hidden="true" />
              Headline TV
            </span>
            <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white">
              {composition.categoryLabel}
            </span>
            <button
              type="button"
              onClick={narration.toggleEnabled}
              disabled={!narration.supported}
              className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition focus:outline-none focus:ring-2 focus:ring-sky-100 ${
                narration.enabled
                  ? "border-sky-200/40 bg-sky-300/20 text-sky-50"
                  : "border-white/12 bg-white/8 text-slate-100 hover:bg-white/12"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-pressed={narration.enabled}
              title={narration.supported ? "Toggle AI narration" : "Narration is not supported in this browser"}
            >
              {narration.enabled ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
              Narration
            </button>
            {showTimestamp ? (
              <time className="rounded-full border border-white/10 bg-slate-950/42 px-4 py-2 text-xs font-semibold text-slate-200" dateTime={story.publishedAt}>
                {relativeTime(story.publishedAt)}
              </time>
            ) : null}
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-200">
            {index + 1} OF {total}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-5xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200/20 bg-sky-200/12 px-4 py-2 text-sm font-semibold text-sky-100">
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              {narration.enabled ? narration.paused ? "Narration paused" : narration.speaking ? "Narrating" : "Narration ready" : activeBeat.label}
            </div>
            <h2 className="max-w-5xl text-balance font-display text-4xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl 2xl:text-7xl">
              {story.title}
            </h2>
            <p className="mt-5 max-w-3xl text-pretty text-xl leading-8 text-slate-100 sm:text-2xl">{activeBeat.subtitle}</p>

            <div className="mt-7 max-w-3xl rounded-[20px] border border-white/12 bg-slate-950/58 p-4 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Why It Matters</p>
              <p className="mt-2 text-base leading-7 text-slate-100">{composition.whyItMatters}</p>
            </div>
          </div>

          <aside className="space-y-4 rounded-[22px] border border-white/12 bg-slate-950/58 p-4 backdrop-blur">
            <SourceIdentity story={story} />
            <TrustBadge story={story} />
            <div className="rounded-[16px] border border-white/10 bg-white/[0.06] p-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-100">Voice Script</p>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-300">{composition.narrationScript}</p>
              {!narration.supported ? <p className="mt-2 text-xs text-amber-200">Browser narration is unavailable here.</p> : null}
            </div>
            <div className="space-y-2">
              {composition.subtitleBeats.map((beat) => {
                const active = beat.id === activeBeat.id;
                return (
                  <div key={beat.id} className={`grid grid-cols-[56px_1fr] gap-3 rounded-[14px] px-3 py-2 ${active ? "bg-white/12 text-white" : "text-slate-400"}`}>
                    <span className="text-xs font-bold tabular-nums">
                      {beat.startSecond}-{beat.endSecond}s
                    </span>
                    <span className="text-sm font-semibold">{beat.label}</span>
                  </div>
                );
              })}
            </div>
            {showCredit && composition.credit ? <p className="text-xs leading-5 text-slate-400">Visual credit: {composition.credit}</p> : null}
          </aside>
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/12" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <div className="h-full rounded-full bg-sky-300 transition-[width] duration-150" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={story.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-sky-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_18px_44px_rgba(56,189,248,0.24)] transition hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            >
              Read Story
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={onToggleSave}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-sky-100"
              aria-pressed={story.saved}
            >
              {story.saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {story.saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={onHide}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-sky-100"
            >
              <EyeOff className="h-4 w-4" />
              Hide
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
