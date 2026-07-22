"use client";

import Link from "next/link";
import { Maximize, Monitor, Settings, Tv } from "lucide-react";

export function PresentationToolbar({
  displayMode,
  tvMode,
  onToggleDisplay,
  onToggleTvMode,
}: {
  displayMode: boolean;
  tvMode: boolean;
  onToggleDisplay: () => void;
  onToggleTvMode: () => void;
}) {
  const requestFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-display text-2xl font-black text-white">Headline Flow</p>
        <p className="text-sm text-slate-400">{tvMode ? "Headline TV: cinematic story stream." : "Watch the news, one story at a time."}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleTvMode}
          className={`flex h-11 w-11 items-center justify-center rounded-full border text-white ${
            tvMode ? "border-sky-200/40 bg-sky-300/20" : "border-white/10 bg-white/6"
          }`}
          aria-label="Toggle Headline TV mode"
          aria-pressed={tvMode}
          title="Headline TV"
        >
          <Tv className="h-5 w-5" />
        </button>
        <button type="button" onClick={onToggleDisplay} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white" aria-label="Toggle presentation mode" title="Presentation mode">
          <Monitor className="h-5 w-5" />
        </button>
        <button type="button" onClick={requestFullscreen} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white" aria-label="Toggle fullscreen" title="Fullscreen">
          <Maximize className="h-5 w-5" />
        </button>
        <Link href="/settings" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white" aria-label="Open settings" title="Settings">
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
