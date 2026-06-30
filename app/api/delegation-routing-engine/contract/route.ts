import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDelegationRoutingResponse, requireDelegationRoutingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDelegationRoutingUser();
    return apiSuccess(getDelegationRoutingResponse());
  } catch (error) {
    return apiError(error, "Unable to load Delegation Routing Engine framework.");
  }
}
