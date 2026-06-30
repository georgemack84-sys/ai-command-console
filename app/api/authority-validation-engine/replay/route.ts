import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayAuthorityValidationRequest, requireAuthorityValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAuthorityValidationUser();
    return apiSuccess(await replayAuthorityValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Authority Validation decision.");
  }
}
