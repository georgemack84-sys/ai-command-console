import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityScoreRequest, requireOptimizationPressureUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOptimizationPressureUser();
    return apiSuccess(await integrityScoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve optimization integrity score.");
  }
}
