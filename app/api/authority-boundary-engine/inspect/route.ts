import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectAuthorityBoundaryRequest, requireAuthorityBoundaryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuthorityBoundaryUser();
    return apiSuccess(await inspectAuthorityBoundaryRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Authority Boundary Engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAuthorityBoundaryUser();
    return apiSuccess(await inspectAuthorityBoundaryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Authority Boundary Engine.");
  }
}
