import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceWeaknessRequest, requireGovernanceWeaknessUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceWeaknessUser();
    return apiSuccess(await inspectGovernanceWeaknessRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Weakness record.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceWeaknessUser();
    return apiSuccess(await inspectGovernanceWeaknessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Weakness record.");
  }
}
