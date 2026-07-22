import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireAdaptiveMemoryObservabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemoryObservabilityUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect adaptive memory observability.");
  }
}
