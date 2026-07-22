import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPatternLedgerRequest, requirePatternLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternLedgerUser();
    return apiSuccess(await replayPatternLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay pattern intelligence ledger.");
  }
}
