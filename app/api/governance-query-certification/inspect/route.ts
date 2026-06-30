import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceQueryCertificationRequest, requireGovernanceQueryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceQueryCertificationUser();
    return apiSuccess(await inspectGovernanceQueryCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance query certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceQueryCertificationUser();
    return apiSuccess(await inspectGovernanceQueryCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance query certification.");
  }
}
