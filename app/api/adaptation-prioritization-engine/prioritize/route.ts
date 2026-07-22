import { apiError, apiSuccess } from "@/src/server/api/response";
import { prioritizeRequest, requireAdaptationPrioritizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationPrioritizationUser();
    return apiSuccess(await prioritizeRequest(request));
  } catch (error) {
    return apiError(error, "Unable to prioritize adaptation proposals.");
  }
}
