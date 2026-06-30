import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectExecutionBoundaryRequest, requireExecutionBoundaryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionBoundaryUser();
    return apiSuccess(await inspectExecutionBoundaryRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Execution Boundary Engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireExecutionBoundaryUser();
    return apiSuccess(await inspectExecutionBoundaryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Execution Boundary Engine.");
  }
}
