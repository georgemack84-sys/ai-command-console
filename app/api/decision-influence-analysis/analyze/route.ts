import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeDecisionInfluenceRequest, requireDecisionInfluenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDecisionInfluenceUser();
    return apiSuccess(await analyzeDecisionInfluenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze decision influence.");
  }
}
