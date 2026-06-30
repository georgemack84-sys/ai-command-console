import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceHistoryRequest, requireGovernanceHistoricalReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceHistoricalReconstructionUser();
    return apiSuccess(await hashGovernanceHistoryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash historical governance reconstruction.");
  }
}
