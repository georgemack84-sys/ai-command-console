import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStressInjectionUser, sequenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStressInjectionUser();
    return apiSuccess(await sequenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to sequence stress faults.");
  }
}
