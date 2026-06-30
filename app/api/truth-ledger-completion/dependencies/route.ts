import { apiError, apiSuccess } from "@/src/server/api/response";
import { getTruthLedgerCompletionForRequest, requireTruthLedgerCompletionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireTruthLedgerCompletionUser();
    return apiSuccess(getTruthLedgerCompletionForRequest(request).ecosystem_dependencies);
  } catch (error) {
    return apiError(error, "Unable to load ecosystem dependency validation.");
  }
}
