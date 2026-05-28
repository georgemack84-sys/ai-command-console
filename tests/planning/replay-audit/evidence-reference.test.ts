import { describe, expect, it } from "vitest";

import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";
import { buildReplayAuditFixture } from "./helpers";

describe("evidence reference", () => {
  it("evidence reference uses immutable hashes only", () => {
    const fixture = buildReplayAuditFixture();
    const result = buildReplayAuditReadiness(fixture);
    expect(result.evidenceReferenceHash).toBeTruthy();
    expect(result.artifacts?.evidenceReference.ledgerEventHashes.every((hash) => typeof hash === "string")).toBe(true);
  });
});
