import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportComplianceCertificationRequest, requireComplianceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceCertificationUser();
    return apiSuccess(await reportComplianceCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to report Compliance Certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireComplianceCertificationUser();
    return apiSuccess(await reportComplianceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to report Compliance Certification.");
  }
}
