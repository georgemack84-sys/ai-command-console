import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntelligenceUser, transitionGovernanceStateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await transitionGovernanceStateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition Governance Intelligence state.");
  }
}
