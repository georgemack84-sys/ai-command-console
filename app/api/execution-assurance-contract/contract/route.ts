import { apiError, apiSuccess } from "@/src/server/api/response";
import { getExecutionAssuranceContractResponse, requireExecutionAssuranceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionAssuranceContractUser();
    return apiSuccess(getExecutionAssuranceContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Execution Assurance Contract.");
  }
}
