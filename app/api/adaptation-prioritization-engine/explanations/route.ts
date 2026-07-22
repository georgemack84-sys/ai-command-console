import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationsRequest, requireAdaptationPrioritizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationPrioritizationUser();
    return apiSuccess(await explanationsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation priority explanations.");
  }
}
