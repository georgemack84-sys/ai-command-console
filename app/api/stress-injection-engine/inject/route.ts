import { apiError, apiSuccess } from "@/src/server/api/response";
import { injectRequest, requireStressInjectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStressInjectionUser();
    return apiSuccess(await injectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run stress injection.");
  }
}
