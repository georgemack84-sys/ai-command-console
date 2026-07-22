import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceCertificationRequest, requirePatternCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternCertificationUser();
    return apiSuccess(await governanceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate pattern intelligence governance certification.");
  }
}
