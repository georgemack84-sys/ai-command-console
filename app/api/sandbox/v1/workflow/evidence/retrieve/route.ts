import { apiError, apiSuccess } from "@/src/server/api/response";
import { admitNuruReadInvocation } from "@/src/server/services/nuru-governed-invocation-service";
import { createSyntheticEvidence, parseSandboxRequestHeaders, sandboxEvidenceRequestSchema } from "@/src/server/services/workflow-sandbox-contract-service";
import { persistSandboxReceipt } from "@/src/server/services/workflow-sandbox-receipt-service";
import { logger } from "@/src/server/observability/logger";

/** Local-only Phase 6.5 contract endpoint. It never performs external retrieval. */
export async function POST(request: Request) {
  try {
    const headers = parseSandboxRequestHeaders({
      authorization: request.headers.get("authorization"),
      correlationId: request.headers.get("x-workflow-correlation-id"),
      idempotencyKey: request.headers.get("idempotency-key"),
    });
    const input = sandboxEvidenceRequestSchema.parse(await request.json());
    const admission = await admitNuruReadInvocation(headers.credential, "evidence.retrieve", input.resource);
    const response = { evidence: createSyntheticEvidence(input), audit: { correlationId: headers.correlationId, idempotencyKey: headers.idempotencyKey, admission } };
    const receipt = await persistSandboxReceipt({ workspaceId: admission.workspaceId, applicationSlug: "nuru", operation: "evidence.retrieve", idempotencyKey: headers.idempotencyKey, correlationId: headers.correlationId, request: input, response });
    return apiSuccess({ ...(receipt.response as typeof response), replayed: receipt.replayed });
  } catch (error) {
    logger.error("Local sandbox evidence endpoint failed", {
      message: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    return apiError(error, "Unable to retrieve sandbox Nuru evidence.");
  }
}
