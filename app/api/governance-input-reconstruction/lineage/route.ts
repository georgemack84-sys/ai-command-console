import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageContextRequest, requireGovernanceInputReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(await lineageContextRequest(request));
  } catch (error) {
    return apiError(error, "Unable to reconstruct lineage context.");
  }
}
