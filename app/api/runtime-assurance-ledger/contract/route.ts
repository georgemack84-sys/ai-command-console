import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRuntimeLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeLedgerUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load runtime assurance ledger contract.");
  }
}
