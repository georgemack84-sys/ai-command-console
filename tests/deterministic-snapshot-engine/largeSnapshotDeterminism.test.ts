import { describe, expect, it } from "vitest";
import { buildSnapshotFixture } from "./helpers";

describe("large snapshot determinism", () => {
  it("remains deterministic for large payloads", () => {
    const largePayload = Object.freeze({
      items: Object.freeze(
        Array.from({ length: 200 }, (_, index) => Object.freeze({
          id: `item-${index.toString().padStart(3, "0")}`,
          hash: `sha256:${index}`,
          metadata: Object.freeze({
            order: index,
            category: index % 2 === 0 ? "even" : "odd",
          }),
        })),
      ),
    });

    const first = buildSnapshotFixture({ payload: largePayload });
    const second = buildSnapshotFixture({ payload: largePayload });

    expect(second.snapshot).toEqual(first.snapshot);
  });
});
