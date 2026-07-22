import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveMemorySecurityUser, validationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemorySecurityUser();
    return apiSuccess(await validationRequest(request, "tamper_detection"));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory tamper detection.");
  }
}
