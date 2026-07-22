import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceMemoryControlUser, validatorRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceMemoryControlUser();
    return apiSuccess(await validatorRequest(request, "constitutional_validation"));
  } catch (error) {
    return apiError(error, "Unable to retrieve memory constitutional validation.");
  }
}
