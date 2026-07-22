import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptationScoringUser, scoreRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationScoringUser();
    return apiSuccess(await scoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to score adaptation proposals.");
  }
}
