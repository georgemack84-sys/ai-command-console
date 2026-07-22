import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPatternIntelligenceContractResponse, requirePatternIntelligenceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternIntelligenceContractUser();
    return apiSuccess(getPatternIntelligenceContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load pattern intelligence contract.");
  }
}
