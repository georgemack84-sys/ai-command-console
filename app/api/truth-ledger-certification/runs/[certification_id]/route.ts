import { apiError, apiSuccess } from "@/src/server/api/response";
import { getTruthLedgerCertificationForRequest, requireTruthLedgerCertificationUser } from "../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ certification_id: string }> }) {
  try {
    await requireTruthLedgerCertificationUser();
    const { certification_id } = await params;
    return apiSuccess(getTruthLedgerCertificationForRequest(request, certification_id));
  } catch (error) {
    return apiError(error, "Unable to load Truth Ledger certification run.");
  }
}
