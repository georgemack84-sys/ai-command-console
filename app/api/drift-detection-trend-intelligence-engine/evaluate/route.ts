import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluateRequest, publishRequest, requireDriftIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDriftIntelligenceUser();
    return apiSuccess(await publishRequest());
  } catch (error) {
    return apiError(error, "Unable to publish drift intelligence.");
  }
}

export async function POST(request: Request) {
  try {
    await requireDriftIntelligenceUser();
    return apiSuccess(await evaluateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate drift intelligence.");
  }
}
