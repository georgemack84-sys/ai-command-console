import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceInputsRequest, requireGovernanceInputReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(await inspectGovernanceInputsRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance input reconstruction.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(await inspectGovernanceInputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance input reconstruction.");
  }
}
