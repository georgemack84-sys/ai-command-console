import { evaluateReplayGovernance } from "../replay/replayGovernance";
import { validateRecoveryReplay } from "./recoveryReplayValidation";
import { evaluateRecoveryReplayEscalation } from "./recoveryReplayEscalation";
import type { SecurityContext } from "../security/securityTypes";
import type { TenantContext } from "../tenancy/tenantTypes";

export async function coordinateRecoveryReplay({
  executionId,
  tenantContext,
  securityContext,
  ledgerEvents = [],
  historicalState = null,
  continuitySnapshots = [],
  auditEvents = [],
  activeRecoveryActions = [],
}: {
  executionId: string;
  tenantContext: TenantContext;
  securityContext?: SecurityContext;
  ledgerEvents?: Record<string, unknown>[];
  historicalState?: Record<string, unknown> | null;
  continuitySnapshots?: Record<string, unknown>[];
  auditEvents?: Record<string, unknown>[];
  activeRecoveryActions?: string[];
}) {
  const replayVerification = validateRecoveryReplay({
    executionId,
    tenantContext,
    ledgerEvents,
    historicalState,
    continuitySnapshots,
    auditEvents,
  });
  if (!replayVerification.ok) {
    return replayVerification;
  }

  const governance = await evaluateReplayGovernance({
    executionId,
    tenantContext,
    securityContext,
    action: replayVerification.data.divergences.length > 0 ? "quarantine" : "replay",
    replayVerification,
    activeRecoveryActions,
  });

  if (!governance.ok) {
    return governance;
  }

  const escalation = evaluateRecoveryReplayEscalation(replayVerification.data.divergences);
  return {
    ok: true as const,
    data: {
      executionId,
      replayVerification: replayVerification.data,
      governance: governance.data,
      escalation,
    },
  };
}
