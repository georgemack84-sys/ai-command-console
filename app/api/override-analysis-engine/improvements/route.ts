import { apiError, apiSuccess } from "@/src/server/api/response";
import { improvementsOverrideRequest, requireOverrideAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOverrideAnalysisUser();
    return apiSuccess(await improvementsOverrideRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate override improvement opportunities.");
  }
}
