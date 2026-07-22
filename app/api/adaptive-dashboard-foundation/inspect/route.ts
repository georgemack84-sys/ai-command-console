import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireAdaptiveDashboardFoundationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveDashboardFoundationUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect adaptive dashboard foundation.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdaptiveDashboardFoundationUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect adaptive dashboard foundation.");
  }
}
