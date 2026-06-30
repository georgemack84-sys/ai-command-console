import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDefaultGovernanceIntelligenceRecord, requireGovernanceIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(getDefaultGovernanceIntelligenceRecord());
  } catch (error) {
    return apiError(error, "Unable to load Governance Intelligence contract.");
  }
}
