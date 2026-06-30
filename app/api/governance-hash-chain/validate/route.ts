import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceHashChainUser, validateGovernanceHashChainRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceHashChainUser();
    return apiSuccess(await validateGovernanceHashChainRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance hash chain.");
  }
}
