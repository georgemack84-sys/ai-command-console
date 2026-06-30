import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireComplianceCertificationUser, runComplianceCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceCertificationUser();
    return apiSuccess(await runComplianceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run Compliance Certification.");
  }
}
