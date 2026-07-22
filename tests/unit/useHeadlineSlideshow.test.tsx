import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHeadlineSlideshow } from "@/hooks/useHeadlineSlideshow";
import type { Headline } from "@/types/headline";

function story(id: string): Headline {
  return {
    id,
    title: `Story ${id} has a sufficiently long title`,
    summary: "A sufficiently long summary for slideshow testing.",
    source: { name: "Mock Source", initials: "MS" },
    category: "top",
    publishedAt: "2026-07-19T12:00:00.000Z",
    articleUrl: `https://example.com/${id}`,
    visualFallback: { symbol: "NEWS", label: "Top Story" },
    importanceScore: 50,
    freshnessScore: 50,
    saved: false,
    hidden: false,
  };
}

describe("useHeadlineSlideshow", () => {
  it("wraps next and previous controls", () => {
    const { result } = renderHook(() =>
      useHeadlineSlideshow({
        stories: [story("a"), story("b")],
        intervalSeconds: 10,
        autoplay: false,
        hiddenIds: new Set(),
        savedIds: new Set(),
      }),
    );

    act(() => result.current.previous());
    expect(result.current.currentStory?.id).toBe("b");
    act(() => result.current.next());
    expect(result.current.currentStory?.id).toBe("a");
  });

  it("toggles pause and play state", () => {
    const { result } = renderHook(() =>
      useHeadlineSlideshow({
        stories: [story("a")],
        intervalSeconds: 10,
        autoplay: true,
        hiddenIds: new Set(),
        savedIds: new Set(),
      }),
    );

    act(() => result.current.pause());
    expect(result.current.playing).toBe(false);
    act(() => result.current.play());
    expect(result.current.playing).toBe(true);
  });

  it("automatically advances after the configured interval", () => {
    vi.useFakeTimers();

    const { result, unmount } = renderHook(() =>
      useHeadlineSlideshow({
        stories: [story("a"), story("b")],
        intervalSeconds: 1,
        autoplay: true,
        hiddenIds: new Set(),
        savedIds: new Set(),
      }),
    );

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.currentStory?.id).toBe("b");
    unmount();
    vi.useRealTimers();
  });
});
