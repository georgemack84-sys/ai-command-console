import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceHashChainRequest, requireGovernanceHashChainUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceHashChainUser();
    return apiSuccess(await inspectGovernanceHashChainRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance hash chain.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceHashChainUser();
    return apiSuccess(await inspectGovernanceHashChainRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance hash chain.");
  }
}
