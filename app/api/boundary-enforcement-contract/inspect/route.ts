import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectBoundaryEnforcementRequest, requireBoundaryEnforcementUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireBoundaryEnforcementUser();
    return apiSuccess(await inspectBoundaryEnforcementRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Boundary Enforcement Contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireBoundaryEnforcementUser();
    return apiSuccess(await inspectBoundaryEnforcementRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Boundary Enforcement Contract.");
  }
}
