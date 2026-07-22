import { apiError, apiSuccess } from "@/src/server/api/response";
import { constitutionalFindingsRequest, requireGovernanceEscalationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceEscalationPatternUser();
    return apiSuccess(await constitutionalFindingsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve constitutional pattern findings.");
  }
}
