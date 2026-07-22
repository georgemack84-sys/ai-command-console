import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAuthorityBoundaryValidatorUser, scopeRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAuthorityBoundaryValidatorUser();
    return apiSuccess(await scopeRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve authority scope.");
  }
}
