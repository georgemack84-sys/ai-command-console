import { buildRecoveryEvidenceBundle } from "../recovery/recoveryEvidenceBuilder";
import { getRuntimeContinuityState } from "../runtime/runtimeContinuityState";
import type { TenantContext } from "../tenancy/tenantTypes";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const executionStateStore = require("../executionStateStore.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const executionIntegrityStore = require("../executionIntegrityStore.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listAuditEvents } = require("../auditTrail.js");

export async function collectRecoveryVerificationEvidence({
  executionId,
  tenantContext,
  nowMs,
  overrides = {},
}: {
  executionId: string;
  tenantContext?: TenantContext;
  nowMs?: number;
  overrides?: Record<string, unknown>;
}) {
  const bundleResult = (overrides.bundle as any) || await buildRecoveryEvidenceBundle({ executionId, nowMs });
  if (!bundleResult?.ok) {
    return {
      ok: false as const,
      error: {
        code: "RECOVERY_VERIFICATION_EVIDENCE_MISSING",
        message: "Recovery verification evidence could not be built.",
      },
    };
  }

  const continuity = overrides.continuityState || getRuntimeContinuityState({ tenantContext, nowMs, persistSnapshot: false });
  const executionState = overrides.executionState || executionStateStore.loadExecutionState(executionId);
  const ledgerResult = overrides.ledgerResult || executionIntegrityStore.listLedgerEvents(
    String((executionState?.execution?.planId || executionState?.execution?.plan_id || bundleResult.data.readModel.executionId || "")),
    executionId,
    tenantContext ? { tenantId: tenantContext.tenantId, workspaceId: tenantContext.workspaceId } : null,
  );
  const auditEvents = overrides.auditEvents || listAuditEvents(5000).filter((event: Record<string, unknown>) => {
    const payload = (event.payload || {}) as Record<string, unknown>;
    return String(payload.executionId || event.execution_id || "") === String(executionId);
  });

  return {
    ok: true as const,
    data: {
      bundle: bundleResult.data,
      continuityState: (continuity as any).ok ? (continuity as any).data : null,
      executionState,
      ledgerEvents: (ledgerResult?.ok ? ledgerResult.data : []) as any[],
      auditEvents: auditEvents as any[],
    },
  };
}
