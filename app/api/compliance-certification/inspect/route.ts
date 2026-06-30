import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectComplianceCertificationRequest, requireComplianceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceCertificationUser();
    return apiSuccess(await inspectComplianceCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireComplianceCertificationUser();
    return apiSuccess(await inspectComplianceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Certification.");
  }
}
