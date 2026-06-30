import { apiError, apiSuccess } from "@/src/server/api/response";
import { getExecutionBoundaryContractResponse, requireExecutionBoundaryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionBoundaryUser();
    return apiSuccess(getExecutionBoundaryContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Execution Boundary Engine contract.");
  }
}
