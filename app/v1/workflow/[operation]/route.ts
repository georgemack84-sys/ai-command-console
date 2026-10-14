import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { admitNuruReadInvocation } from "@/src/server/services/nuru-governed-invocation-service";
import { assertNuruWorkflowEvidenceCorrelation, nuruWorkflowEvidenceRequestSchema, retrieveNuruWorkflowEvidence, validateNuruWorkflowEvidenceHeaders } from "@/src/server/services/nuru-workflow-evidence-contract-service";

export const dynamic = "force-dynamic";

/** Nuru's independently deployable, read-only workflow capability. */
export async function POST(request: Request, context: RouteContext<"/v1/workflow/[operation]">) {
  try {
    const { operation } = await context.params;
    if (operation !== "evidence:retrieve") throw new AppError(404, "workflow_operation_not_found", "The requested workflow operation does not exist.");
    const headers = validateNuruWorkflowEvidenceHeaders({
      authorization: request.headers.get("authorization"),
      correlationId: request.headers.get("x-correlation-id"),
      idempotencyKey: request.headers.get("idempotency-key"),
    });
    const input = nuruWorkflowEvidenceRequestSchema.parse(await request.json());
    assertNuruWorkflowEvidenceCorrelation(input, headers);
    const admission = await admitNuruReadInvocation(headers.credential, "evidence.retrieve", input.resource);
    const result = await retrieveNuruWorkflowEvidence(input, admission);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, "Nuru evidence retrieval is unavailable.");
  }
}
