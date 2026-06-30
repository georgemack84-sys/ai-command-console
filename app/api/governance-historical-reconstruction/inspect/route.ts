import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceHistoryRequest, requireGovernanceHistoricalReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceHistoricalReconstructionUser();
    return apiSuccess(await inspectGovernanceHistoryRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect historical governance reconstruction.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceHistoricalReconstructionUser();
    return apiSuccess(await inspectGovernanceHistoryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect historical governance reconstruction.");
  }
}
