import { apiError, apiSuccess } from "@/src/server/api/response";
import { buildGovernanceHashChainRequest, requireGovernanceHashChainUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceHashChainUser();
    return apiSuccess(await buildGovernanceHashChainRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build governance hash chain.");
  }
}
