import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDecisionInfluenceUser, validateDecisionInfluenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDecisionInfluenceUser();
    return apiSuccess(await validateDecisionInfluenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate decision influence analysis.");
  }
}
