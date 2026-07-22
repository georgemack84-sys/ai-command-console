import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEscalationRestrictionEngineUser, workflowRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationRestrictionEngineUser();
    return apiSuccess(await workflowRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve escalation review workflow.");
  }
}
