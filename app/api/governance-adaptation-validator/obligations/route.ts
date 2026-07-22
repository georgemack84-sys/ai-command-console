import { apiError, apiSuccess } from "@/src/server/api/response";
import { obligationsRequest, requireGovernanceAdaptationValidatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAdaptationValidatorUser();
    return apiSuccess(await obligationsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance adaptation obligations.");
  }
}
