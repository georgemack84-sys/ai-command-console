import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceIntegrityCertificationRequest, requireGovernanceIntegrityCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntegrityCertificationUser();
    return apiSuccess(await inspectGovernanceIntegrityCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance integrity certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityCertificationUser();
    return apiSuccess(await inspectGovernanceIntegrityCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance integrity certification.");
  }
}
