import { describe, expect, it } from "vitest";
import { nuruDiscoverTopicPreferencesSchema } from "@/src/server/services/nuru-discover-topic-preference-service";

describe("Nuru Discover topic preferences", () => {
  it("accepts a bounded, explicitly supplied topic list", () => {
    expect(nuruDiscoverTopicPreferencesSchema.parse({ topics: [" architecture ", "governance"] })).toEqual({
      topics: ["architecture", "governance"],
    });
  });

  it("rejects an oversized or blank preference", () => {
    expect(() => nuruDiscoverTopicPreferencesSchema.parse({ topics: [""] })).toThrow();
    expect(() => nuruDiscoverTopicPreferencesSchema.parse({ topics: Array.from({ length: 21 }, (_, index) => `topic-${index}`) })).toThrow();
  });
});
