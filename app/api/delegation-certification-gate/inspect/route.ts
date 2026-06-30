import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectDelegationCertificationRequest, requireDelegationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDelegationCertificationUser();
    return apiSuccess(await inspectDelegationCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Delegation Certification Gate.");
  }
}

export async function POST(request: Request) {
  try {
    await requireDelegationCertificationUser();
    return apiSuccess(await inspectDelegationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Delegation Certification Gate.");
  }
}
