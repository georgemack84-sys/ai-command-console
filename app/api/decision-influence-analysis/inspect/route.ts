import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectDecisionInfluenceRequest, requireDecisionInfluenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDecisionInfluenceUser();
    return apiSuccess(await inspectDecisionInfluenceRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect decision influence analysis.");
  }
}

export async function POST(request: Request) {
  try {
    await requireDecisionInfluenceUser();
    return apiSuccess(await inspectDecisionInfluenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect decision influence analysis.");
  }
}
