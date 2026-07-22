import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requireGovernanceRiskUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskUser();
    return apiSuccess(await decisionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance risk decision.");
  }
}
