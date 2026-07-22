import { apiError, apiSuccess } from "@/src/server/api/response";
import { detectPatternRequest, requirePatternDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternDetectionUser();
    return apiSuccess(await detectPatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to detect patterns.");
  }
}
