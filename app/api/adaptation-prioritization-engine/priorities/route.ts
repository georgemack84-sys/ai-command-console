import { apiError, apiSuccess } from "@/src/server/api/response";
import { prioritiesRequest, requireAdaptationPrioritizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationPrioritizationUser();
    return apiSuccess(await prioritiesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation priorities.");
  }
}
