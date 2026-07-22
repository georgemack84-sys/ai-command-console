import { apiError, apiSuccess } from "@/src/server/api/response";
import { dimensionsRequest, requireAdaptationScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationScoringUser();
    return apiSuccess(await dimensionsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation scoring dimensions.");
  }
}
