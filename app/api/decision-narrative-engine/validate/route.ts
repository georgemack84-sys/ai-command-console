import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDecisionNarrativeUser, validateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDecisionNarrativeUser();
    return apiSuccess(await validateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate decision narrative.");
  }
}
