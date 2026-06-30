import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPolicyIntelligenceCertificationRequest, requirePolicyIntelligenceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyIntelligenceCertificationUser();
    return apiSuccess(await inspectPolicyIntelligenceCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Policy Intelligence certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePolicyIntelligenceCertificationUser();
    return apiSuccess(await inspectPolicyIntelligenceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Policy Intelligence certification.");
  }
}
