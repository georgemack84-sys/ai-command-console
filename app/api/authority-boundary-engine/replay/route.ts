import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityBoundaryReplayRequest, requireAuthorityBoundaryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAuthorityBoundaryUser();
    return apiSuccess(await authorityBoundaryReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Authority Boundary decision.");
  }
}
