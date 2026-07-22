import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternScoringUser, scorePatternRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternScoringUser();
    return apiSuccess(await scorePatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to score pattern intelligence.");
  }
}
