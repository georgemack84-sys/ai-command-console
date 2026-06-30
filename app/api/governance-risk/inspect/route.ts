import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceRiskRequest, requireGovernanceRiskUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceRiskUser();
    return apiSuccess(await inspectGovernanceRiskRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Risk record.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskUser();
    return apiSuccess(await inspectGovernanceRiskRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Risk record.");
  }
}
