import { apiError, apiSuccess } from "@/src/server/api/response";
import { getComplianceCertificationContract, requireComplianceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceCertificationUser();
    return apiSuccess(getComplianceCertificationContract());
  } catch (error) {
    return apiError(error, "Unable to load Compliance Certification contract.");
  }
}
