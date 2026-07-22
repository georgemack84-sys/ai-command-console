"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export function SlideshowControls({
  playing,
  progress,
  current,
  total,
  onPrevious,
  onNext,
  onTogglePlaying,
}: {
  playing: boolean;
  progress: number;
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlaying: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full rounded-full bg-sky-300 transition-[width] duration-150" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ControlButton label="Previous story" onClick={onPrevious}>
            <ChevronLeft className="h-5 w-5" />
          </ControlButton>
          <ControlButton label={playing ? "Pause slideshow" : "Play slideshow"} onClick={onTogglePlaying} primary>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </ControlButton>
          <ControlButton label="Next story" onClick={onNext}>
            <ChevronRight className="h-5 w-5" />
          </ControlButton>
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-300">
          {total ? current + 1 : 0} OF {total}
        </p>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-12 w-12 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-sky-100 ${
        primary ? "bg-white text-slate-950 hover:bg-sky-100" : "border border-white/10 bg-white/6 text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
