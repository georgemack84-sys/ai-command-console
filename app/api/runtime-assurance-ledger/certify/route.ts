import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRequest, requireRuntimeLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeLedgerUser();
    return apiSuccess(await certifyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify runtime assurance ledger.");
  }
}
