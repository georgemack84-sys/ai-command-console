import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGovernanceEscalationPatternRequest, requireGovernanceEscalationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceEscalationPatternUser();
    return apiSuccess(await replayGovernanceEscalationPatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay governance escalation pattern intelligence.");
  }
}
