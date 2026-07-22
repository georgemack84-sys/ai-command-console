"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CategorySelector } from "@/components/headline-flow/CategorySelector";
import { EmptySlide } from "@/components/headline-flow/EmptySlide";
import { ErrorSlide } from "@/components/headline-flow/ErrorSlide";
import { HeadlineSlide } from "@/components/headline-flow/HeadlineSlide";
import { HeadlineTvSlide } from "@/components/headline-flow/HeadlineTvSlide";
import { LoadingSlide } from "@/components/headline-flow/LoadingSlide";
import { PresentationToolbar } from "@/components/headline-flow/PresentationToolbar";
import { SlideshowControls } from "@/components/headline-flow/SlideshowControls";
import { useHeadlineSettings } from "@/hooks/useHeadlineSettings";
import { useHeadlineSlideshow } from "@/hooks/useHeadlineSlideshow";
import { useSavedStories } from "@/hooks/useSavedStories";
import { headlineCategories, type Headline, type HeadlineCategory } from "@/types/headline";

type FetchState = "loading" | "ready" | "error";

export function HeadlineApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { settings, setSettings, ready } = useHeadlineSettings();
  const { savedIds, hiddenIds, toggleSaved, hideStory, restoreHidden } = useSavedStories();
  const [stories, setStories] = useState<Headline[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [forceMock, setForceMock] = useState(false);

  const initialCategory = searchParams.get("category") || settings.defaultCategory;
  const category = headlineCategories.includes(initialCategory as HeadlineCategory) ? (initialCategory as HeadlineCategory) : "top";
  const [displayMode, setDisplayMode] = useState(searchParams.get("mode") === "display");
  const [tvMode, setTvMode] = useState(searchParams.get("view") === "tv");
  const autoplay = searchParams.get("autoplay") ? searchParams.get("autoplay") === "true" : settings.autoplay;

  const filteredStories = useMemo(
    () =>
      stories.filter(
        (story) =>
          !settings.blockedSources.includes(story.source.name) &&
          !settings.hiddenCategories.includes(story.category),
      ),
    [settings.blockedSources, settings.hiddenCategories, stories],
  );

  const slideshow = useHeadlineSlideshow({
    stories: filteredStories,
    intervalSeconds: settings.slideDurationSeconds,
    autoplay,
    hiddenIds,
    savedIds,
  });

  const loadHeadlines = useCallback(async (loadMock = forceMock) => {
    setFetchState("loading");
    try {
      const response = await fetch(`/api/headlines?category=${category}&limit=25${loadMock ? "&mock=true" : ""}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "The headline service returned an error.");
      setStories(body.stories ?? []);
      setFetchState("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The headline service could not be reached.");
      setFetchState("error");
    }
  }, [category, forceMock]);

  useEffect(() => {
    if (ready) void loadHeadlines();
  }, [loadHeadlines, ready]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", category);
    if (displayMode) params.set("mode", "display");
    else params.delete("mode");
    if (tvMode) params.set("view", "tv");
    else params.delete("view");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [category, displayMode, pathname, router, searchParams, tvMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft") slideshow.previous();
      if (event.key === "ArrowRight") slideshow.next();
      if (event.key === " ") {
        event.preventDefault();
        slideshow.togglePlaying();
      }
      if (event.key.toLowerCase() === "f") setDisplayMode((value) => !value);
      if (event.key.toLowerCase() === "t") setTvMode((value) => !value);
      if (event.key === "Escape") setDisplayMode(false);
      if (event.key.toLowerCase() === "s" && slideshow.currentStory) toggleSaved(slideshow.currentStory.id);
      if (event.key.toLowerCase() === "h" && slideshow.currentStory) hideStory(slideshow.currentStory.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hideStory, slideshow, toggleSaved]);

  const onCategoryChange = (next: HeadlineCategory) => {
    setSettings((current) => ({ ...current, defaultCategory: next }));
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const shellClass = displayMode
    ? "fixed inset-0 z-50 overflow-y-auto bg-[#020817] p-3 sm:p-6"
    : "min-h-screen bg-[#020817] px-3 py-5 text-white sm:px-5 lg:px-8";

  return (
    <div className={shellClass}>
      <div className={`mx-auto flex w-full flex-col gap-5 ${displayMode ? "max-w-[1800px]" : "max-w-7xl"}`}>
        <PresentationToolbar
          displayMode={displayMode}
          tvMode={tvMode}
          onToggleDisplay={() => setDisplayMode((value) => !value)}
          onToggleTvMode={() => setTvMode((value) => !value)}
        />
        {!displayMode ? <CategorySelector value={category} onChange={onCategoryChange} /> : null}

        {fetchState === "loading" ? <LoadingSlide /> : null}
        {fetchState === "error" ? (
          <ErrorSlide
            message={errorMessage}
            onRetry={loadHeadlines}
            onMock={() => {
              setForceMock(true);
              void loadHeadlines(true);
            }}
          />
        ) : null}
        {fetchState === "ready" && !slideshow.currentStory ? <EmptySlide category={category} onClear={restoreHidden} /> : null}
        {fetchState === "ready" && slideshow.currentStory ? (
          <>
            {tvMode ? (
              <HeadlineTvSlide
                story={slideshow.currentStory}
                index={slideshow.currentIndex}
                total={slideshow.visibleStories.length}
                progress={slideshow.progress}
                playing={slideshow.playing}
                showTimestamp={settings.showTimestamps}
                showCredit={settings.showImageCredits}
                onToggleSave={() => {
                  if (slideshow.currentStory) toggleSaved(slideshow.currentStory.id);
                }}
                onHide={() => {
                  if (slideshow.currentStory) hideStory(slideshow.currentStory.id);
                }}
              />
            ) : (
              <HeadlineSlide
                story={slideshow.currentStory}
                index={slideshow.currentIndex}
                total={slideshow.visibleStories.length}
                showSummary={settings.showSummaries}
                showTimestamp={settings.showTimestamps}
                showCredit={settings.showImageCredits}
                textScale={displayMode ? "television" : settings.textScale}
                onToggleSave={() => {
                  if (slideshow.currentStory) toggleSaved(slideshow.currentStory.id);
                }}
                onHide={() => {
                  if (slideshow.currentStory) hideStory(slideshow.currentStory.id);
                }}
              />
            )}
            {!tvMode ? (
              <SlideshowControls
                playing={slideshow.playing}
                progress={slideshow.progress}
                current={slideshow.currentIndex}
                total={slideshow.visibleStories.length}
                onPrevious={slideshow.previous}
                onNext={slideshow.next}
                onTogglePlaying={slideshow.togglePlaying}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
