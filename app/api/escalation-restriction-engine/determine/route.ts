import { apiError, apiSuccess } from "@/src/server/api/response";
import { determineRequest, requireEscalationRestrictionEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationRestrictionEngineUser();
    return apiSuccess(await determineRequest(request));
  } catch (error) {
    return apiError(error, "Unable to determine escalation and restriction path.");
  }
}
