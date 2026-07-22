import { apiError, apiSuccess } from "@/src/server/api/response";
import { compositePatternScoringRequest, requirePatternScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternScoringUser();
    return apiSuccess(await compositePatternScoringRequest(request));
  } catch (error) {
    return apiError(error, "Unable to calculate composite pattern score.");
  }
}
