import { apiError, apiSuccess } from "@/src/server/api/response";
import { policyRequest, requireMemoryLifecycleUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMemoryLifecycleUser();
    return apiSuccess(await policyRequest(request, "expiration_policy"));
  } catch (error) {
    return apiError(error, "Unable to retrieve memory expiration policies.");
  }
}
