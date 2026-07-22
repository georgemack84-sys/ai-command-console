import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireOutcomeDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOutcomeDashboardUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve outcome intelligence dashboard contract.");
  }
}
