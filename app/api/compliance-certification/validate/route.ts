import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireComplianceCertificationUser, validateComplianceCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceCertificationUser();
    return apiSuccess(await validateComplianceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Compliance Certification.");
  }
}
