import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOverrideAnalysisUser, validateOverrideRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOverrideAnalysisUser();
    return apiSuccess(await validateOverrideRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate override analysis.");
  }
}
