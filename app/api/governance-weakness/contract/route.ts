import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceWeaknessContract, requireGovernanceWeaknessUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceWeaknessUser();
    return apiSuccess(getGovernanceWeaknessContract());
  } catch (error) {
    return apiError(error, "Unable to load Governance Weakness contract.");
  }
}
