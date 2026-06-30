import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceReplayCertificationRequest, requireGovernanceReplayCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceReplayCertificationUser();
    return apiSuccess(await inspectGovernanceReplayCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance replay certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayCertificationUser();
    return apiSuccess(await inspectGovernanceReplayCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance replay certification.");
  }
}
