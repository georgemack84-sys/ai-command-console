import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, getIntegrityRecordsForRequest, requireIntegrityViewerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireIntegrityViewerUser();
    const alerts = getIntegrityRecordsForRequest(request).flatMap((record) => getIntegrityDetailForRequest(request, record.target.target_id).tamper_detection.alerts);
    return apiSuccess(alerts);
  } catch (error) {
    return apiError(error, "Unable to load tamper alerts.");
  }
}
