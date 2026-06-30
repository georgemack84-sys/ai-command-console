import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeSupervisionCertificationUser, runtimeSupervisionCertificationVisibilityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeSupervisionCertificationUser();
    return apiSuccess(await runtimeSupervisionCertificationVisibilityRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Runtime Supervision certification visibility.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRuntimeSupervisionCertificationUser();
    return apiSuccess(await runtimeSupervisionCertificationVisibilityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Runtime Supervision certification visibility.");
  }
}
