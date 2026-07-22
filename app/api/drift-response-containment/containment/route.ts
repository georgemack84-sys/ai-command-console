import { apiError, apiSuccess } from "@/src/server/api/response";
import { containmentRequest, requireDriftResponseUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftResponseUser();
    return apiSuccess(await containmentRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve containment decision.");
  }
}
