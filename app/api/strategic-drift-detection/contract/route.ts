import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStrategicDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategicDriftUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve strategic drift detection contract.");
  }
}
