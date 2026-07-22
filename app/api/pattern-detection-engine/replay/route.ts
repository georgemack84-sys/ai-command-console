import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPatternDetectionRequest, requirePatternDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternDetectionUser();
    return apiSuccess(await replayPatternDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay pattern detection.");
  }
}
