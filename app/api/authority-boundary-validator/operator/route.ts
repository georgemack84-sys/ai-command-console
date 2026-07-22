import { apiError, apiSuccess } from "@/src/server/api/response";
import { operatorRequest, requireAuthorityBoundaryValidatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAuthorityBoundaryValidatorUser();
    return apiSuccess(await operatorRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve operator authority.");
  }
}
