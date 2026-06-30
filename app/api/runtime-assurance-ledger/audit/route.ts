import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireRuntimeLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeLedgerUser();
    return apiSuccess(await auditRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load runtime assurance ledger audit index.");
  }
}
