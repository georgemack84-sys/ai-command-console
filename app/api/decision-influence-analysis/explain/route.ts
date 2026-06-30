import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainDecisionInfluenceRequest, requireDecisionInfluenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDecisionInfluenceUser();
    return apiSuccess(await explainDecisionInfluenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain decision influence.");
  }
}
