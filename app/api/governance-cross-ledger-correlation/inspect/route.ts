import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceCorrelationRequest, requireGovernanceCrossLedgerCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceCrossLedgerCorrelationUser();
    return apiSuccess(await inspectGovernanceCorrelationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance cross-ledger correlation.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceCrossLedgerCorrelationUser();
    return apiSuccess(await inspectGovernanceCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance cross-ledger correlation.");
  }
}
