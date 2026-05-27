import { describe, expect, it } from "vitest";
import { reconstructReplayAudit } from "@/services/replay";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("replay audit reconstruction", () => {
  it("reconstructs deterministic replay audit evidence", () => {
    const bundle = buildReplayBundle();
    const audit = reconstructReplayAudit(bundle.manifest!, bundle.snapshot!, bundle.ledger);
    const repeated = reconstructReplayAudit(bundle.manifest!, bundle.snapshot!, bundle.ledger);

    expect(audit.auditHash).toBe(repeated.auditHash);
    expect(audit.ledgerEventHashes).toEqual(repeated.ledgerEventHashes);
  });
});
