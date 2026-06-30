import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceRiskScoreRequest, requireGovernanceRiskScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceRiskScoringUser();
    return apiSuccess(await inspectGovernanceRiskScoreRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Risk Score.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskScoringUser();
    return apiSuccess(await inspectGovernanceRiskScoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Risk Score.");
  }
}
