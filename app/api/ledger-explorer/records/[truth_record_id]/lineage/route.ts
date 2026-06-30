import { apiError, apiSuccess } from "@/src/server/api/response";
import { getLedgerExplorerDetailForRequest, requireLedgerExplorerUser } from "../../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ truth_record_id: string }> }) {
  try {
    await requireLedgerExplorerUser();
    const { truth_record_id } = await params;
    const detail = getLedgerExplorerDetailForRequest(request, truth_record_id);
    return apiSuccess({ parent_refs: detail.record.references.parent_refs, child_refs: detail.record.references.child_refs, graph: detail.graph });
  } catch (error) {
    return apiError(error, "Unable to load ledger lineage.");
  }
}
