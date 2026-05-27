import { describe, expect, it } from "vitest";

import { evaluateRestoreReadiness } from "@/services/continuity/restoreReadiness";

describe("continuity readiness", () => {
  it("fails readiness on corruption", () => {
    const result = evaluateRestoreReadiness({
      integrity: {
        ok: false,
        error: {
          code: "BACKUP_INTEGRITY_FAILED",
          message: "corrupted",
          details: { issues: ["snapshot_hash_mismatch"] },
        },
      },
      restore: null,
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("RESTORE_READINESS_FAILED");
  });

  it("requires successful verification before execution resumes", () => {
    const result = evaluateRestoreReadiness({
      integrity: {
        ok: true,
        data: {
          ready: true,
          continuity: { ledgerOrdered: true, orphanFree: true, replayConsistent: true },
          issues: [],
        },
      },
      restore: {
        ok: false,
        error: {
          code: "RESTORE_SIMULATION_FAILED",
          message: "restore mismatch",
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error.details?.freezeExecution).toBe(true);
  });
});
