import { describe, expect, it } from "vitest";
import { applyAlignmentFlags, summarizeSourceAlignment } from "@/services/signal-engine";

describe("sourceAlignment", () => {
  it("calculates the alignment ratio correctly", () => {
    const alignments = [
      {
        source_id: "source-a",
        previous_value: -4.5,
        new_value: -6,
        movement_direction: "TOWARD_FAVORITE" as const,
        timestamp: "2026-06-05T13:00:00.000Z",
      },
      {
        source_id: "source-b",
        previous_value: -4.5,
        new_value: -6,
        movement_direction: "TOWARD_FAVORITE" as const,
        timestamp: "2026-06-05T13:00:15.000Z",
      },
      {
        source_id: "source-c",
        previous_value: -4.5,
        new_value: -4,
        movement_direction: "TOWARD_UNDERDOG" as const,
        timestamp: "2026-06-05T13:00:25.000Z",
      },
    ];

    const summary = summarizeSourceAlignment(alignments);
    expect(summary).toEqual({
      aligned_source_count: 2,
      total_source_count: 3,
      alignment_ratio: 0.6667,
      majority_direction: "TOWARD_FAVORITE",
    });

    expect(applyAlignmentFlags(alignments, summary)).toMatchObject([
      { source_id: "source-a", aligned: true },
      { source_id: "source-b", aligned: true },
      { source_id: "source-c", aligned: false },
    ]);
  });
});
