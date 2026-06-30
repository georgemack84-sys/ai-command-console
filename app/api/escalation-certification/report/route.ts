import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportEscalationCertificationRequest, requireEscalationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationCertificationUser();
    return apiSuccess(await reportEscalationCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to load escalation certification report.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEscalationCertificationUser();
    return apiSuccess(await reportEscalationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load escalation certification report.");
  }
}
