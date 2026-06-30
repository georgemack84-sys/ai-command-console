import { apiError, apiSuccess } from "@/src/server/api/response";
import { baselinesRequest, requireDriftIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDriftIntelligenceUser();
    return apiSuccess(await baselinesRequest());
  } catch (error) {
    return apiError(error, "Unable to load certified drift baselines.");
  }
}
