import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceStateRequest, requireGovernanceStateReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceStateReconstructionUser();
    return apiSuccess(await hashGovernanceStateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance state package.");
  }
}
