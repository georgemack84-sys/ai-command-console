import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExecutionAssuranceContractUser, versionExecutionAssuranceContractResponse } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionAssuranceContractUser();
    return apiSuccess(versionExecutionAssuranceContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Execution Assurance version policy.");
  }
}
