import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionBoundaryLedgerRequest, requireExecutionBoundaryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionBoundaryUser();
    return apiSuccess(await executionBoundaryLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve Execution Boundary ledger entry.");
  }
}
