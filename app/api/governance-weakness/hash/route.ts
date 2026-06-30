import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceWeaknessRequest, requireGovernanceWeaknessUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceWeaknessUser();
    return apiSuccess(await hashGovernanceWeaknessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash Governance Weakness record.");
  }
}
