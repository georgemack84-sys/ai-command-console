import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceQueryCertificationUser, validateGovernanceQueryCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceQueryCertificationUser();
    return apiSuccess(await validateGovernanceQueryCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance query certification.");
  }
}
