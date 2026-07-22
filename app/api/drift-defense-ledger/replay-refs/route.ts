import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRefsRequest, requireDriftLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftLedgerUser();
    return apiSuccess(await replayRefsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve replay references.");
  }
}
