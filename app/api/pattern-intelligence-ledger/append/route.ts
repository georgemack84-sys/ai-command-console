import { apiError, apiSuccess } from "@/src/server/api/response";
import { appendPatternLedgerRequest, requirePatternLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternLedgerUser();
    return apiSuccess(await appendPatternLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to append pattern intelligence ledger record.");
  }
}
