import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConfidenceAdaptationLedgerUser, verifyRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceAdaptationLedgerUser();
    return apiSuccess(await verifyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to verify confidence adaptation ledger.");
  }
}
