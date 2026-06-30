import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntelligenceUser, validateGovernanceIntelligenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await validateGovernanceIntelligenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Governance Intelligence contract.");
  }
}
