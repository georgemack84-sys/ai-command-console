import { apiError, apiSuccess } from "@/src/server/api/response";
import { getLedgerExplorerDetailForRequest, requireLedgerExplorerUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ truth_record_id: string }> }) {
  try {
    await requireLedgerExplorerUser();
    const { truth_record_id } = await params;
    return apiSuccess(getLedgerExplorerDetailForRequest(request, truth_record_id).replay_refs);
  } catch (error) {
    return apiError(error, "Unable to load replay references.");
  }
}
