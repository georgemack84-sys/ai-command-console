import * as auditTrail from "../auditTrail.js";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { SamAuditResult } from "./samTypes";
import {
  getSamChaosFailureInjectionMode,
  onSamChaosAuditAppendAttempt,
  onSamChaosAuditAppendSkipped,
} from "./chaos/samFailureInjection";
import { measureSamAsyncDuration } from "./performance/samLatencyTracker";
import { recordSamThroughputEvent } from "./performance/samThroughputTracker";

export async function appendSamAuditEvent({
  type,
  proposalId,
  executionId,
  actor = "system",
  payload,
  tenantContext,
}: {
  db?: unknown;
  type: string;
  proposalId: string;
  executionId: string;
  actor?: string;
  payload?: Record<string, unknown>;
  tenantContext?: TenantContext;
}): Promise<SamAuditResult> {
  return measureSamAsyncDuration("sam.audit.append.duration", async () => {
    try {
      if (typeof auditTrail.appendAuditEvent !== "function") {
        onSamChaosAuditAppendSkipped();
        return {
          attempted: true,
          appended: false,
          skipped: true,
          reason: "SAFE_AUDIT_API_NOT_FOUND",
        };
      }

      onSamChaosAuditAppendAttempt(type);
      const chaosMode = getSamChaosFailureInjectionMode();
      if (chaosMode) {
        recordSamThroughputEvent("audit_appended");
        return {
          attempted: true,
          appended: true,
          auditId: `chaos_audit_${type}`,
        };
      }
      const entry = auditTrail.appendAuditEvent({
        actor,
        type,
        message: `${type} for ${executionId}`,
        payload: {
          proposalId,
          executionId,
          tenantId: tenantContext?.tenantId,
          workspaceId: tenantContext?.workspaceId,
          ...(payload || {}),
        },
      });

      if (!entry || typeof entry !== "object") {
        onSamChaosAuditAppendSkipped();
        return {
          attempted: true,
          appended: false,
          skipped: true,
          reason: "SAFE_AUDIT_API_NOT_FOUND",
        };
      }

      recordSamThroughputEvent("audit_appended");
      return {
        attempted: true,
        appended: true,
        auditId: String(entry?.id || ""),
      };
    } catch {
      onSamChaosAuditAppendSkipped();
      return {
        attempted: true,
        appended: false,
        skipped: true,
        reason: "SAFE_AUDIT_API_NOT_FOUND",
      };
    }
  });
}
