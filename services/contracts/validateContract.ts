import type { ZodTypeAny } from "zod";

import type { ContractValidationResult } from "./contractTypes";
import { createValidationError } from "./validationErrors";
import { strictParse } from "./strictModeValidator";
import { recordValidationTelemetry } from "./validationTelemetry";
import { TENANT_ERROR_CODES } from "../tenancy/tenantErrors";
import type { TenantContext } from "../tenancy/tenantTypes";

export function validateContractPayload<T>({
  schema,
  payload,
  tenantScope,
}: {
  schema: ZodTypeAny;
  payload: unknown;
  tenantScope?: {
    required?: boolean;
    tenantContext?: TenantContext;
  };
}): ContractValidationResult<T> {
  if (tenantScope?.required && !tenantScope.tenantContext) {
    return {
      ok: false,
      error: createValidationError(
        TENANT_ERROR_CODES.TENANT_CONTRACT_SCOPE_MISMATCH,
        "Tenant-scoped contract validation requires tenant context.",
      ),
    };
  }

  const parsed = strictParse(schema, payload);
  if (!parsed.success) {
    const hasUnknownField = parsed.error.issues.some((issue) => issue.code === "unrecognized_keys");
    recordValidationTelemetry("validation_failed", tenantScope?.tenantContext);
    recordValidationTelemetry("strict_mode_rejection", tenantScope?.tenantContext);
    if (hasUnknownField) {
      recordValidationTelemetry("unknown_field_rejected", tenantScope?.tenantContext);
    }
    return {
      ok: false,
      error: createValidationError(
        hasUnknownField ? "API_UNKNOWN_FIELD" : "API_VALIDATION_FAILED",
        "Contract validation failed.",
        { issues: parsed.error.issues },
      ),
    };
  }

  if (tenantScope?.tenantContext) {
    const parsedPayload = parsed.data as Record<string, unknown>;
    const payloadTenantId = String(parsedPayload?.tenantId || "").trim();
    const payloadWorkspaceId = String(parsedPayload?.workspaceId || "").trim();
    if (
      (payloadTenantId && payloadTenantId !== tenantScope.tenantContext.tenantId)
      || (payloadWorkspaceId && payloadWorkspaceId !== tenantScope.tenantContext.workspaceId)
    ) {
      recordValidationTelemetry("tenant_scope_mismatch", tenantScope.tenantContext);
      return {
        ok: false,
        error: createValidationError(
          TENANT_ERROR_CODES.TENANT_CONTRACT_SCOPE_MISMATCH,
          "Contract payload leaked data from another tenant.",
        ),
      };
    }
  }

  return {
    ok: true,
    data: parsed.data as T,
  };
}
