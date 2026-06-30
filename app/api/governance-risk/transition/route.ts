import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceRiskUser, transitionGovernanceRiskRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskUser();
    return apiSuccess(await transitionGovernanceRiskRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition Governance Risk state.");
  }
}
