import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDriftHealthContractResponse, requireDriftHealthIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDriftHealthIntelligenceUser();
    return apiSuccess(getDriftHealthContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Drift & Health Intelligence.");
  }
}
