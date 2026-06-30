import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionAssuranceCertificationLedgerRequest, requireExecutionAssuranceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionAssuranceCertificationUser();
    return apiSuccess(await executionAssuranceCertificationLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Execution Assurance decision ledger entry.");
  }
}
