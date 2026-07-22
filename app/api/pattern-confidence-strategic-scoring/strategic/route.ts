import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternScoringUser, strategicPatternScoringRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternScoringUser();
    return apiSuccess(await strategicPatternScoringRequest(request));
  } catch (error) {
    return apiError(error, "Unable to calculate pattern strategic scoring.");
  }
}
