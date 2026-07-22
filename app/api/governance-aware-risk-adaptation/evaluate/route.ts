import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluateRequest, requireGovernanceRiskUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskUser();
    return apiSuccess(await evaluateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate governance-aware risk adaptation.");
  }
}
