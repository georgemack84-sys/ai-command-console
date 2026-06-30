import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomyContractResponse, requireAutonomyContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyContractUser();
    return apiSuccess(getAutonomyContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve autonomy contract.");
  }
}
