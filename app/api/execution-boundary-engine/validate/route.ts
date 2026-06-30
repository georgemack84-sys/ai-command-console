import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExecutionBoundaryUser, validateExecutionBoundaryRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionBoundaryUser();
    return apiSuccess(await validateExecutionBoundaryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Execution Boundary.");
  }
}
