import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPatternLedgerRequest, requirePatternLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternLedgerUser();
    return apiSuccess(await inspectPatternLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect pattern intelligence ledger.");
  }
}
