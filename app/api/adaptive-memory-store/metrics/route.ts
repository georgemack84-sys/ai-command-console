import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireAdaptiveMemoryStoreUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemoryStoreUser();
    return apiSuccess(await metricsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory store metrics.");
  }
}
