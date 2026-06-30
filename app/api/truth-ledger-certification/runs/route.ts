import { apiError, apiSuccess } from "@/src/server/api/response";
import { readTruthLedgerCertificationRun, requireTruthLedgerCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTruthLedgerCertificationUser();
    return apiSuccess(await readTruthLedgerCertificationRun(request), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to run Truth Ledger certification.");
  }
}
