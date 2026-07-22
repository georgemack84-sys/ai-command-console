import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeGovernanceEscalationPatternRequest, requireGovernanceEscalationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceEscalationPatternUser();
    return apiSuccess(await analyzeGovernanceEscalationPatternRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze governance escalation patterns.");
  }
}
