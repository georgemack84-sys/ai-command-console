import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStrategicFailureUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategicFailureUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve strategic failure analyzer contract.");
  }
}
