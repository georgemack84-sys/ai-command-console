import { apiError, apiSuccess } from "@/src/server/api/response";
import { recoveryRequest, requireDriftResponseUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftResponseUser();
    return apiSuccess(await recoveryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve recovery readiness.");
  }
}
