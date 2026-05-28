export function evaluateRecoveryConstraints({
  verificationDisputed,
  conflictingActions = [],
}: {
  verificationDisputed: boolean;
  conflictingActions?: string[];
}) {
  if (verificationDisputed) {
    return {
      ok: false as const,
      error: {
        code: "RECOVERY_VERIFICATION_UNRESOLVED",
        message: "Recovery is blocked while verification remains disputed.",
      },
    };
  }
  if (conflictingActions.length > 0) {
    return {
      ok: false as const,
      error: {
        code: "RECOVERY_CONFLICTING_ACTIONS",
        message: "Recovery is blocked by conflicting active actions.",
        details: { conflictingActions },
      },
    };
  }
  return {
    ok: true as const,
  };
}
