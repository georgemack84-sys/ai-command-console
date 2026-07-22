import { apiError, apiSuccess } from "@/src/server/api/response";
import { factorsRequest, requireAdaptationPrioritizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationPrioritizationUser();
    return apiSuccess(await factorsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation priority factors.");
  }
}
