import { describe, expect, it } from "vitest";
import { ISOLATION_FAILURE_CODES } from "@/services/isolation-boundary-engine";
import { buildReplayRequestFromEvaluation, evaluateZoneFixture } from "@/tests/isolation-boundary-engine/helpers";

describe("replay isolation", () => {
  it("reconstructs identical sandbox and authority hashes for the same replay request", () => {
    const baseline = evaluateZoneFixture();
    expect(baseline.allowed).toBe(true);
    const replayRequest = buildReplayRequestFromEvaluation(baseline);

    const replay = evaluateZoneFixture({ replayRequest });

    expect(replay.allowed).toBe(true);
    expect(replay.sandbox?.sandboxHash).toBe(baseline.sandbox?.sandboxHash);
    expect(replay.profile?.zoneAuthorityHash).toBe(baseline.profile?.zoneAuthorityHash);
    expect(replay.credentialScope?.scopeHash).toBe(baseline.credentialScope?.scopeHash);
  });

  it("fails closed when replay tries to use upgraded isolation policy", () => {
    const baseline = evaluateZoneFixture();
    expect(baseline.allowed).toBe(true);
    const replayRequest = {
      ...buildReplayRequestFromEvaluation(baseline),
      originalNetworkPolicyHash: "sha256-upgraded-network-policy",
    };

    const replay = evaluateZoneFixture({ replayRequest });

    expect(replay.allowed).toBe(false);
    expect(replay.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_NETWORK_POLICY_VIOLATION)).toBe(true);
  });
});

