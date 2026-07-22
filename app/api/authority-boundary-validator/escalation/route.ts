import { apiError, apiSuccess } from "@/src/server/api/response";
import { escalationRequest, requireAuthorityBoundaryValidatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAuthorityBoundaryValidatorUser();
    return apiSuccess(await escalationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve authority escalation.");
  }
}
