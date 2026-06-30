import { apiError, apiSuccess } from "@/src/server/api/response";
import { graphDecisionInfluenceRequest, requireDecisionInfluenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDecisionInfluenceUser();
    return apiSuccess(await graphDecisionInfluenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build influence graph.");
  }
}
