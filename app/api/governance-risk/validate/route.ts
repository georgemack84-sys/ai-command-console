import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceRiskUser, validateGovernanceRiskRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskUser();
    return apiSuccess(await validateGovernanceRiskRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Governance Risk record.");
  }
}
