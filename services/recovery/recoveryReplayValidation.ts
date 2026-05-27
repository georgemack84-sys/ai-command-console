import { verifyReplay } from "../replay/replayVerificationEngine";
import type { TenantContext } from "../tenancy/tenantTypes";

export function validateRecoveryReplay({
  executionId,
  tenantContext,
  ledgerEvents = [],
  historicalState = null,
  continuitySnapshots = [],
  auditEvents = [],
}: {
  executionId: string;
  tenantContext: TenantContext;
  ledgerEvents?: Record<string, unknown>[];
  historicalState?: Record<string, unknown> | null;
  continuitySnapshots?: Record<string, unknown>[];
  auditEvents?: Record<string, unknown>[];
}) {
  return verifyReplay({
    executionId,
    tenantContext,
    ledgerEvents,
    historicalState,
    continuitySnapshots,
    auditEvents,
  });
}
