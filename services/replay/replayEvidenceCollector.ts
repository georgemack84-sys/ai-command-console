import { listContinuitySnapshots } from "../runtime/continuityLedger";
import type { TenantContext } from "../tenancy/tenantTypes";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const executionStateStore = require("../executionStateStore.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const executionIntegrityStore = require("../executionIntegrityStore.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listAuditEvents } = require("../auditTrail.js");

export function collectReplayEvidence({
  executionId,
  tenantContext,
  overrides = {},
}: {
  executionId: string;
  tenantContext?: TenantContext;
  overrides?: Record<string, unknown>;
}) {
  const executionState = overrides.executionState || executionStateStore.loadExecutionState(executionId);
  const planId = String(
    (executionState?.execution?.planId || executionState?.execution?.plan_id || executionState?.planId || executionId),
  );
  const ledgerResult = overrides.ledgerResult || executionIntegrityStore.listLedgerEvents(
    planId,
    executionId,
    tenantContext ? { tenantId: tenantContext.tenantId, workspaceId: tenantContext.workspaceId } : null,
  );
  const auditEvents = (overrides.auditEvents as Record<string, unknown>[] | undefined)
    || listAuditEvents(5000).filter((event: Record<string, unknown>) => {
      const payload = (event.payload || {}) as Record<string, unknown>;
      return String(payload.executionId || event.execution_id || "") === String(executionId);
    });
  const continuitySnapshots = (overrides.continuitySnapshots as Record<string, unknown>[] | undefined)
    || listContinuitySnapshots({ tenantId: tenantContext?.tenantId || null, limit: 20 });

  return {
    executionState,
    historicalState: (overrides.historicalState as Record<string, unknown> | null | undefined) || {
      runtimeState: String(executionState?.execution?.status || executionState?.checkpoint?.status || ""),
      outputHash: String(executionState?.execution?.outputHash || ""),
      historicalSequence: (ledgerResult?.ok ? ledgerResult.data : []).map((event: Record<string, unknown>) => String(event.eventType || event.type || "")),
    },
    ledgerEvents: (overrides.ledgerEvents as Record<string, unknown>[] | undefined)
      || ((ledgerResult?.ok ? ledgerResult.data : []) as Record<string, unknown>[]),
    auditEvents,
    continuitySnapshots,
  };
}
