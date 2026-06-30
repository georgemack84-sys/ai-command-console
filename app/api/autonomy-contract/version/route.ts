import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyContractUser, versionAutonomyContractResponse } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyContractUser();
    return apiSuccess(versionAutonomyContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve autonomy contract version policy.");
  }
}
