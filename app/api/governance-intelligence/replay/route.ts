import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGovernanceStateRequest, requireGovernanceIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await replayGovernanceStateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Governance Intelligence state path.");
  }
}
