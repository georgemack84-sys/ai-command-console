import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRuntimeSupervisionContractRequest, requireRuntimeSupervisionContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeSupervisionContractUser();
    return apiSuccess(await inspectRuntimeSupervisionContractRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Runtime Supervision Contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRuntimeSupervisionContractUser();
    return apiSuccess(await inspectRuntimeSupervisionContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Runtime Supervision Contract.");
  }
}
