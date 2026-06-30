import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageGovernanceHashChainRequest, requireGovernanceHashChainUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceHashChainUser();
    return apiSuccess(await lineageGovernanceHashChainRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance hash-chain lineage.");
  }
}
