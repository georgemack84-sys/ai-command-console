import { apiError, apiSuccess } from "@/src/server/api/response";
import { enforcementRequest, requireEscalationRestrictionEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationRestrictionEngineUser();
    return apiSuccess(await enforcementRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve restriction enforcement report.");
  }
}
