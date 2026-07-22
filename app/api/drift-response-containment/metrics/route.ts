import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireDriftResponseUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftResponseUser();
    return apiSuccess(await metricsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve drift response metrics.");
  }
}
