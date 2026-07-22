"use client";

import { useState } from "react";
import { CategoryFallback } from "@/components/headline-flow/CategoryFallback";
import type { Headline } from "@/types/headline";

export function HeadlineVisual({
  story,
  showCredit,
}: {
  story: Headline;
  showCredit: boolean;
}) {
  return <HeadlineImage key={story.id} story={story} showCredit={showCredit} />;
}

function HeadlineImage({ story, showCredit }: { story: Headline; showCredit: boolean }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const image = failed ? undefined : story.image;

  if (!image) {
    return (
      <div className="relative h-full min-h-[280px]">
        <CategoryFallback category={story.category} label={story.visualFallback?.label} />
      </div>
    );
  }

  return (
    <figure className="relative h-full min-h-[280px] overflow-hidden bg-slate-950">
      {!loaded ? <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,#122033,#1b3353,#122033)]" /> : null}
      <img
        src={image.url}
        alt={image.alt}
        className={`h-full w-full object-cover transition duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.1),rgba(2,6,23,0.45))]" />
      {showCredit && image.credit ? (
        <figcaption className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-200 backdrop-blur">
          {image.credit}
        </figcaption>
      ) : null}
    </figure>
  );
}
