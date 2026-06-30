import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundaryCertificationLedgerRequest, requireBoundaryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireBoundaryCertificationUser();
    return apiSuccess(await boundaryCertificationLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve Boundary Certification ledger entry.");
  }
}
