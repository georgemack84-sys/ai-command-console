import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceWeaknessUser, validateGovernanceWeaknessRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceWeaknessUser();
    return apiSuccess(await validateGovernanceWeaknessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Governance Weakness record.");
  }
}
