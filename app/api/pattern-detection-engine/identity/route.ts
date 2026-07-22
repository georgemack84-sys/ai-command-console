import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityPatternDetectionRequest, requirePatternDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternDetectionUser();
    return apiSuccess(await identityPatternDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to verify detected pattern identity.");
  }
}
