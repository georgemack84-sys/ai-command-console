"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookmarkX, ExternalLink } from "lucide-react";
import { useSavedStories } from "@/hooks/useSavedStories";
import { categoryLabels } from "@/lib/news/categories";
import type { Headline } from "@/types/headline";

export function SavedStoriesClient() {
  const { savedIds, toggleSaved, clearSaved } = useSavedStories();
  const [stories, setStories] = useState<Headline[]>([]);

  useEffect(() => {
    void fetch("/api/headlines?category=top&limit=50&mock=true")
      .then((response) => response.json())
      .then((body) => setStories(body.stories ?? []));
  }, []);

  const savedStories = useMemo(() => stories.filter((story) => savedIds.has(story.id)), [savedIds, stories]);

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-100">Headline Flow</p>
            <h1 className="mt-2 font-display text-4xl font-black">Saved Stories</h1>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={clearSaved} className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-bold">
              Clear saved
            </button>
            <Link href="/" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
              Back to slideshow
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {savedStories.length ? (
            savedStories.map((story) => (
              <article key={story.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-100">{categoryLabels[story.category]}</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">{story.title}</h2>
                    <p className="mt-2 text-slate-300">{story.summary}</p>
                  </div>
                  <button type="button" onClick={() => toggleSaved(story.id)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6" aria-label="Unsave story">
                    <BookmarkX className="h-5 w-5" />
                  </button>
                </div>
                <a href={story.articleUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-200">
                  Read original <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            ))
          ) : (
            <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-slate-300">
              No saved stories yet. Save a story from the slideshow and it will appear here after reload.
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
