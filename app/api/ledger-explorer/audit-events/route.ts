import { apiError, apiSuccess } from "@/src/server/api/response";
import { readLedgerAuditEvent, requireLedgerExplorerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireLedgerExplorerUser();
    return apiSuccess(await readLedgerAuditEvent(request), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to record Ledger Explorer audit event.");
  }
}
