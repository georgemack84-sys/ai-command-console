import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGovernanceCorrelationRequest, requireGovernanceCrossLedgerCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceCrossLedgerCorrelationUser();
    return apiSuccess(await replayGovernanceCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance replay correlation.");
  }
}
