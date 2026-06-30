import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegritySummaryForRequest, requireIntegrityViewerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireIntegrityViewerUser();
    return apiSuccess(getIntegritySummaryForRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load Integrity Status Viewer summary.");
  }
}
