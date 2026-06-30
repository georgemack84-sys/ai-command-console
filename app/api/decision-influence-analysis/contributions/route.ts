import { apiError, apiSuccess } from "@/src/server/api/response";
import { contributionsDecisionInfluenceRequest, requireDecisionInfluenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDecisionInfluenceUser();
    return apiSuccess(await contributionsDecisionInfluenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to calculate influence contributions.");
  }
}
