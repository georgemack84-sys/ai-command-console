import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireGovernanceAdaptationCertificationGateUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAdaptationCertificationGateUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay governance adaptation certification.");
  }
}
