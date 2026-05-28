export function evaluateRestoreReadiness({
  integrity,
  restore,
}: {
  integrity:
    | { ok: true; data: { ready: boolean; continuity: { ledgerOrdered: boolean; orphanFree: boolean; replayConsistent: boolean }; issues: string[] } }
    | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } };
  restore:
    | { ok: true; data: { issues: string[] } }
    | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } }
    | null;
}) {
  if (!integrity.ok) {
    return {
      ok: false as const,
      error: {
        code: "RESTORE_READINESS_FAILED",
        message: "Integrity verification failed.",
        details: {
          freezeExecution: true,
          reason: integrity.error.code,
        },
      },
    };
  }

  if (!integrity.data.ready || integrity.data.issues.length > 0) {
    return {
      ok: false as const,
      error: {
        code: "RESTORE_READINESS_FAILED",
        message: "Backup is not restore-ready.",
        details: {
          freezeExecution: true,
          reason: integrity.data.issues,
        },
      },
    };
  }

  if (restore && !restore.ok) {
    return {
      ok: false as const,
      error: {
        code: "RESTORE_READINESS_FAILED",
        message: "Restore simulation failed.",
        details: {
          freezeExecution: true,
          reason: restore.error.code,
        },
      },
    };
  }

  return {
    ok: true as const,
    data: {
      ready: true,
      freezeExecution: false,
    },
  };
}
