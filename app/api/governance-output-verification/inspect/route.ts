import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceOutputsRequest, requireGovernanceOutputVerificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceOutputVerificationUser();
    return apiSuccess(await inspectGovernanceOutputsRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance output verification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceOutputVerificationUser();
    return apiSuccess(await inspectGovernanceOutputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance output verification.");
  }
}
