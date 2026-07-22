"use client";

import { Bookmark, BookmarkCheck, EyeOff, ExternalLink } from "lucide-react";
import { HeadlineVisual } from "@/components/headline-flow/HeadlineVisual";
import { SourceIdentity } from "@/components/headline-flow/SourceIdentity";
import { TrustBadge } from "@/components/headline-flow/TrustBadge";
import { categoryLabels } from "@/lib/news/categories";
import { relativeTime } from "@/lib/utils/dates";
import type { Headline } from "@/types/headline";

export function HeadlineSlide({
  story,
  index,
  total,
  showSummary,
  showTimestamp,
  showCredit,
  onToggleSave,
  onHide,
  textScale,
}: {
  story: Headline;
  index: number;
  total: number;
  showSummary: boolean;
  showTimestamp: boolean;
  showCredit: boolean;
  onToggleSave: () => void;
  onHide: () => void;
  textScale: "standard" | "large" | "television";
}) {
  const headlineSize =
    textScale === "television" ? "text-4xl sm:text-5xl 2xl:text-7xl" : textScale === "large" ? "text-3xl sm:text-5xl" : "text-3xl sm:text-4xl 2xl:text-5xl";

  return (
    <article
      aria-live="polite"
      className="grid min-h-[620px] overflow-hidden rounded-[28px] border border-white/12 bg-[#07111f] shadow-[0_30px_120px_rgba(0,0,0,0.42)] lg:grid-cols-[46%_54%]"
    >
      <div className="relative min-h-[280px]">
        <HeadlineVisual story={story} showCredit={showCredit} />
      </div>

      <div className="flex min-h-[340px] flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border border-sky-300/20 bg-sky-300/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-100">
              {categoryLabels[story.category]}
            </span>
            {showTimestamp ? <time className="text-sm text-slate-400" dateTime={story.publishedAt}>{relativeTime(story.publishedAt)}</time> : null}
          </div>
          <h2 className={`mt-7 text-balance font-display font-black leading-[1.04] tracking-normal text-white ${headlineSize}`}>{story.title}</h2>
          {showSummary ? <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-slate-300 sm:text-xl">{story.summary}</p> : null}
          <div className="mt-5">
            <TrustBadge story={story} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SourceIdentity story={story} />
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              {index + 1} OF {total}
            </p>
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
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-100"
              aria-pressed={story.saved}
            >
              {story.saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {story.saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={onHide}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-100"
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
