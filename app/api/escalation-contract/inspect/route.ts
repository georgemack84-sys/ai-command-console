import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectEscalationContractRequest, requireEscalationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationContractUser();
    return apiSuccess(await inspectEscalationContractRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect escalation contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEscalationContractUser();
    return apiSuccess(await inspectEscalationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect escalation contract.");
  }
}
