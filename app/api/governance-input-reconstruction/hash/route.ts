import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceInputsRequest, requireGovernanceInputReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(await hashGovernanceInputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance input package.");
  }
}
