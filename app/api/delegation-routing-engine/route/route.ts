import { apiError, apiSuccess } from "@/src/server/api/response";
import { packageDelegationRoutingRequest, requireDelegationRoutingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDelegationRoutingUser();
    return apiSuccess((await packageDelegationRoutingRequest(request)).routing_decision);
  } catch (error) {
    return apiError(error, "Unable to build Routing decision.");
  }
}
