import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntegrityCertificationUser, testsGovernanceIntegrityCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityCertificationUser();
    return apiSuccess(await testsGovernanceIntegrityCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance integrity certification tests.");
  }
}
