import { beforeEach, describe, expect, it } from "vitest";

import {
  clearSamChaosFailureInjection,
  configureSamChaosFailureInjection,
  getSamChaosFailureInjectionMode,
  getSamChaosMetrics,
  onSamChaosAuditAppendAttempt,
  onSamChaosDryRunStart,
  onSamChaosStoreRead,
  onSamChaosStoreWrite,
} from "../../services/sam/chaos/samFailureInjection.ts";

beforeEach(() => {
  clearSamChaosFailureInjection();
});

describe("sam failure injection", () => {
  it("tracks deterministic metrics", () => {
    configureSamChaosFailureInjection({ deterministicSeed: "seed-metrics" });
    onSamChaosStoreRead();
    onSamChaosStoreWrite();
    onSamChaosDryRunStart();
    onSamChaosAuditAppendAttempt("sam.dry_run.generated");

    expect(getSamChaosMetrics()).toEqual(
      expect.objectContaining({
        storeReadCount: 1,
        storeWriteCount: 1,
        dryRunInvocationCount: 1,
        auditAppendCount: 1,
      }),
    );
  });

  it("exposes configured failure mode", () => {
    configureSamChaosFailureInjection({
      deterministicSeed: "seed-mode",
      failStoreWrite: true,
    });
    expect(getSamChaosFailureInjectionMode()).toEqual(
      expect.objectContaining({
        deterministicSeed: "seed-mode",
        failStoreWrite: true,
      }),
    );
  });
});
