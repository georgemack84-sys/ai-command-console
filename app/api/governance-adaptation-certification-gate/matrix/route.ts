import { apiError, apiSuccess } from "@/src/server/api/response";
import { matrixRequest, requireGovernanceAdaptationCertificationGateUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAdaptationCertificationGateUser();
    return apiSuccess(await matrixRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance adaptation certification matrix.");
  }
}
