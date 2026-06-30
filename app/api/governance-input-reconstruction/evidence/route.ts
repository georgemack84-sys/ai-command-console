import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceContextRequest, requireGovernanceInputReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(await evidenceContextRequest(request));
  } catch (error) {
    return apiError(error, "Unable to reconstruct evidence context.");
  }
}
