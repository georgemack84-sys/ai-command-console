import { apiError, apiSuccess } from "@/src/server/api/response";
import { reconstructGovernanceInputsRequest, requireGovernanceInputReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(await reconstructGovernanceInputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to reconstruct governance inputs.");
  }
}
