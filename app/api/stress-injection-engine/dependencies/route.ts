import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependenciesRequest, requireStressInjectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStressInjectionUser();
    return apiSuccess(await dependenciesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build dependency injection graphs.");
  }
}
