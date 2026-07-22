import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireSynchronizedPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSynchronizedPlanningUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load synchronized planning assurance contract.");
  }
}
