import type { ZodTypeAny } from "zod";

import { diffReplayPayloads } from "./replayDiff";
import { recordContractTelemetry } from "./contractTelemetry";
import { validateContractPayload } from "./validateContract";
import type { TenantContext } from "../tenancy/tenantTypes";

export function validateReplayPayload({
  contractId,
  version,
  schema,
  payload,
  tenantScope,
}: {
  contractId: string;
  version: string;
  schema: ZodTypeAny;
  payload: unknown;
  tenantScope?: {
    required?: boolean;
    tenantContext?: TenantContext;
  };
}) {
  const validated = validateContractPayload({ schema, payload, tenantScope });
  if (!validated.ok) {
    recordContractTelemetry("replay_validation_failed", tenantScope?.tenantContext);
    return {
      ok: false as const,
      error: {
        code: validated.error.code === "TENANT_CONTRACT_SCOPE_MISMATCH" ? validated.error.code : "API_REPLAY_FAILED",
        message:
          validated.error.code === "TENANT_CONTRACT_SCOPE_MISMATCH"
            ? validated.error.message
            : `Replay validation failed for ${contractId}@${version}.`,
        details: validated.error.details,
      },
    };
  }

  const diff = diffReplayPayloads(validated.data, payload);
  if (diff) {
    recordContractTelemetry("replay_validation_failed", tenantScope?.tenantContext);
    return {
      ok: false as const,
      error: {
        code: "API_REPLAY_FAILED",
        message: `Replay drift detected for ${contractId}@${version}.`,
        details: diff,
      },
    };
  }

  return {
    ok: true as const,
    data: validated.data,
  };
}
