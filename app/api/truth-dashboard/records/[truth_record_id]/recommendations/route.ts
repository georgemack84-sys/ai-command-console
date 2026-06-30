import { apiError, apiSuccess } from "@/src/server/api/response";
import { getTruthDashboardDetailForRequest, requireTruthDashboardUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ truth_record_id: string }> }) {
  try {
    await requireTruthDashboardUser();
    const { truth_record_id } = await params;
    return apiSuccess(getTruthDashboardDetailForRequest(request, truth_record_id).recommendation ?? null);
  } catch (error) {
    return apiError(error, "Unable to load recommendation context.");
  }
}
