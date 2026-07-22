import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDriftLedgerUser, schemaRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftLedgerUser();
    return apiSuccess(await schemaRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve drift ledger schema.");
  }
}
