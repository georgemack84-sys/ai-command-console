import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveMemoryObservabilityUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemoryObservabilityUser();
    return apiSuccess(await sectionRequest(request, "retrieval_analytics"));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory retrieval analytics.");
  }
}
