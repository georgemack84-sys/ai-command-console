import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceIntelligenceRequest, requireGovernanceIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await hashGovernanceIntelligenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash Governance Intelligence contract.");
  }
}
