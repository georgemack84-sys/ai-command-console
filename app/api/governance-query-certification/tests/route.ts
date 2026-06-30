import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceQueryCertificationUser, testsGovernanceQueryCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceQueryCertificationUser();
    return apiSuccess(await testsGovernanceQueryCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance query certification tests.");
  }
}
