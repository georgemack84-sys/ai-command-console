import { apiError, apiSuccess } from "@/src/server/api/response";
import { admitHeadlineDraftInvocation } from "@/src/server/services/headline-flow-governed-invocation-service";
import { createSandboxHeadline, parseSandboxRequestHeaders, sandboxHeadlineRequestSchema } from "@/src/server/services/workflow-sandbox-contract-service";
import { persistSandboxReceipt } from "@/src/server/services/workflow-sandbox-receipt-service";
import { logger } from "@/src/server/observability/logger";

/** Local-only Phase 6.5 contract endpoint. It never publishes a headline. */
export async function POST(request: Request) {
  try {
    const headers = parseSandboxRequestHeaders({
      authorization: request.headers.get("authorization"),
      correlationId: request.headers.get("x-workflow-correlation-id"),
      idempotencyKey: request.headers.get("idempotency-key"),
    });
    const input = sandboxHeadlineRequestSchema.parse(await request.json());
    const admission = await admitHeadlineDraftInvocation(headers.credential, input.evidence.resource);
    const response = { ...createSandboxHeadline(input), audit: { correlationId: headers.correlationId, idempotencyKey: headers.idempotencyKey, admission } };
    const receipt = await persistSandboxReceipt({ workspaceId: admission.workspaceId, applicationSlug: "headline-flow", operation: "headline.draft", idempotencyKey: headers.idempotencyKey, correlationId: headers.correlationId, request: input, response });
    return apiSuccess({ ...(receipt.response as typeof response), replayed: receipt.replayed });
  } catch (error) {
    logger.error("Local sandbox headline endpoint failed", {
      message: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    return apiError(error, "Unable to draft a sandbox headline.");
  }
}
