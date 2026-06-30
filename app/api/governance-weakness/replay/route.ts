import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGovernanceWeaknessRequest, requireGovernanceWeaknessUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceWeaknessUser();
    return apiSuccess(await replayGovernanceWeaknessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Governance Weakness record.");
  }
}
