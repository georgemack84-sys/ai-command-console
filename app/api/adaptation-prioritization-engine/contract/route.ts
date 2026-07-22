import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptationPrioritizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptationPrioritizationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation prioritization contract.");
  }
}
