import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, requireIntegrityViewerUser } from "../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ tamper_alert_id: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { tamper_alert_id } = await params;
    return apiSuccess(getIntegrityDetailForRequest(request, tamper_alert_id).tamper_detection);
  } catch (error) {
    return apiError(error, "Unable to load tamper alert.");
  }
}
