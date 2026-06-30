import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceQueryCertificationRequest, requireGovernanceQueryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceQueryCertificationUser();
    return apiSuccess(await hashGovernanceQueryCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance query certification.");
  }
}
