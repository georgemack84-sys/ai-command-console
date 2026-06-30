import { apiError, apiSuccess } from "@/src/server/api/response";
import { createLedgerSegmentDisplay } from "@/services/integrity-viewer";
import { getIntegrityRecordsForRequest, requireIntegrityViewerUser } from "../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ segment_id: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { segment_id } = await params;
    return apiSuccess(createLedgerSegmentDisplay(getIntegrityRecordsForRequest(request), segment_id));
  } catch (error) {
    return apiError(error, "Unable to load integrity ledger segment.");
  }
}
