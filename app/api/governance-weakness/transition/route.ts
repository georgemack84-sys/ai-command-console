import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceWeaknessUser, transitionGovernanceWeaknessRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceWeaknessUser();
    return apiSuccess(await transitionGovernanceWeaknessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition Governance Weakness record.");
  }
}
