import { apiError, apiSuccess } from "@/src/server/api/response";
import { outcomeOverrideRequest, requireOverrideAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOverrideAnalysisUser();
    return apiSuccess(await outcomeOverrideRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate override outcome.");
  }
}
