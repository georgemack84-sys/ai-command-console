import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEscalationRestrictionEngineUser, reviewersRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationRestrictionEngineUser();
    return apiSuccess(await reviewersRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve escalation reviewers.");
  }
}
