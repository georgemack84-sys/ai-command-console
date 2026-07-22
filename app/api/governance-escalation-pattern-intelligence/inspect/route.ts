import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceEscalationPatternRequest, requireGovernanceEscalationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceEscalationPatternUser();
    return apiSuccess(await inspectGovernanceEscalationPatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance escalation pattern intelligence.");
  }
}
