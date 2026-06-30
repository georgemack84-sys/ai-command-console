import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayComplianceCertificationRequest, requireComplianceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceCertificationUser();
    return apiSuccess(await replayComplianceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Compliance Certification.");
  }
}
