import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernancePolicyRequest, requireGovernancePolicyUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernancePolicyUser();
    return apiSuccess(await inspectGovernancePolicyRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Governance & Policy Enforcement Engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernancePolicyUser();
    return apiSuccess(await inspectGovernancePolicyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Governance & Policy Enforcement Engine.");
  }
}
