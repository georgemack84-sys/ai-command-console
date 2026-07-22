import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceFindingsRequest, requireGovernanceEscalationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceEscalationPatternUser();
    return apiSuccess(await governanceFindingsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance pattern findings.");
  }
}
