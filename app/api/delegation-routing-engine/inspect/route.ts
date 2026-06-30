import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectDelegationRoutingRequest, requireDelegationRoutingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDelegationRoutingUser();
    return apiSuccess(await inspectDelegationRoutingRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Delegation Routing package.");
  }
}

export async function POST(request: Request) {
  try {
    await requireDelegationRoutingUser();
    return apiSuccess(await inspectDelegationRoutingRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Delegation Routing package.");
  }
}
