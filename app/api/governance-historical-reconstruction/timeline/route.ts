import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceHistoricalReconstructionUser, timelineGovernanceHistoryRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceHistoricalReconstructionUser();
    return apiSuccess(await timelineGovernanceHistoryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve historical governance timeline.");
  }
}
