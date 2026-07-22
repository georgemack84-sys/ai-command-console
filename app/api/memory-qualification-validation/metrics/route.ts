import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireMemoryQualificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMemoryQualificationUser();
    return apiSuccess(await metricsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve qualification metrics.");
  }
}
