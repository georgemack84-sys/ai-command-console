import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternCertificationUser, tenantCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternCertificationUser();
    return apiSuccess(await tenantCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate pattern intelligence tenant isolation.");
  }
}
