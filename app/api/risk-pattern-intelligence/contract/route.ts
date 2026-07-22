import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRiskPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRiskPatternUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve risk pattern contract.");
  }
}
