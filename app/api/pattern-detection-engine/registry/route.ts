import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryPatternDetectionRequest, requirePatternDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternDetectionUser();
    return apiSuccess(await registryPatternDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern detection registry.");
  }
}
