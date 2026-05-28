import { describe, expect, it } from "vitest";

import { buildConstitutionalCoordinationFixture } from "./helpers";

describe("constitutional coordination chronology", () => {
  it("preserves append-only chronology", () => {
    const first = buildConstitutionalCoordinationFixture({ createdAt: "2026-05-17T11:00:00.000Z" });
    const second = buildConstitutionalCoordinationFixture({
      createdAt: "2026-05-17T11:01:00.000Z",
      existingChronology: first.record.chronology,
    });

    expect(first.record.chronology.entries.length).toBe(1);
    expect(second.record.chronology.entries.length).toBe(2);
  });
});
