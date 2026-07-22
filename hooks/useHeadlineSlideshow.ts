"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Headline } from "@/types/headline";

export function useHeadlineSlideshow({
  stories,
  intervalSeconds,
  autoplay,
  hiddenIds,
  savedIds,
}: {
  stories: Headline[];
  intervalSeconds: number;
  autoplay: boolean;
  hiddenIds: Set<string>;
  savedIds: Set<string>;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [progress, setProgress] = useState(0);
  const storiesKey = stories.map((story) => story.id).join("|");

  const visibleStories = useMemo(
    () => stories.filter((story) => !hiddenIds.has(story.id)).map((story) => ({ ...story, saved: savedIds.has(story.id), hidden: false })),
    [hiddenIds, savedIds, stories],
  );

  const resetProgress = useCallback(() => {
    setProgress(0);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (!visibleStories.length) return;
      setCurrentIndex(((index % visibleStories.length) + visibleStories.length) % visibleStories.length);
      resetProgress();
    },
    [resetProgress, visibleStories.length],
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const previous = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const pause = useCallback(() => setPlaying(false), []);
  const play = useCallback(() => {
    resetProgress();
    setPlaying(true);
  }, [resetProgress]);
  const togglePlaying = useCallback(() => (playing ? pause() : play()), [pause, play, playing]);

  useEffect(() => {
    setPlaying(autoplay);
  }, [autoplay]);

  useEffect(() => {
    setCurrentIndex(0);
    resetProgress();
  }, [resetProgress, storiesKey]);

  useEffect(() => {
    if (currentIndex >= visibleStories.length) setCurrentIndex(Math.max(0, visibleStories.length - 1));
  }, [currentIndex, visibleStories.length]);

  useEffect(() => {
    if (!playing || !visibleStories.length) return;
    const tickMs = 100;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const nextProgress = current + tickMs / (intervalSeconds * 1000);
        if (nextProgress >= 1) {
          setCurrentIndex((index) => (index + 1) % visibleStories.length);
          return 0;
        }
        return nextProgress;
      });
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [intervalSeconds, playing, visibleStories.length]);

  return {
    currentIndex,
    currentStory: visibleStories[currentIndex] ?? null,
    visibleStories,
    playing,
    progress,
    next,
    previous,
    pause,
    play,
    togglePlaying,
    goTo,
  };
}
