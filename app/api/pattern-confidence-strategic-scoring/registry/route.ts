import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryPatternScoringRequest, requirePatternScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternScoringUser();
    return apiSuccess(await registryPatternScoringRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern scoring registry.");
  }
}
