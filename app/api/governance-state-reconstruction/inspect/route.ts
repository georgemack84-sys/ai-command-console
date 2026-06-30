import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceStateRequest, requireGovernanceStateReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceStateReconstructionUser();
    return apiSuccess(await inspectGovernanceStateRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance state reconstruction.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceStateReconstructionUser();
    return apiSuccess(await inspectGovernanceStateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance state reconstruction.");
  }
}
