import { apiError, apiSuccess } from "@/src/server/api/response";
import { monitoringRequest, requireAdaptiveRuntimeAssuranceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveRuntimeAssuranceUser();
    return apiSuccess(await monitoringRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive runtime monitoring.");
  }
}
