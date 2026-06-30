import { apiError, apiSuccess } from "@/src/server/api/response";
import { getTruthDashboardDetailForRequest, requireTruthDashboardUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ truth_record_id: string }> }) {
  try {
    await requireTruthDashboardUser();
    const { truth_record_id } = await params;
    const detail = getTruthDashboardDetailForRequest(request, truth_record_id);
    return apiSuccess({
      integrity_state: detail.record.integrity_state,
      integrity_indicators: detail.integrity_indicators,
      warnings: detail.warnings,
    });
  } catch (error) {
    return apiError(error, "Unable to load integrity context.");
  }
}
