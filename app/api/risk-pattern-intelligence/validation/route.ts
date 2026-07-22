import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskPatternUser, validationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskPatternUser();
    return apiSuccess(await validationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk pattern validation.");
  }
}
