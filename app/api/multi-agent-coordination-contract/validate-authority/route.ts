import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMultiAgentCoordinationUser, validateAuthorityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiAgentCoordinationUser();
    return apiSuccess(await validateAuthorityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate multi-agent coordination authority.");
  }
}
