import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireStressInjectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStressInjectionUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect stress injection.");
  }
}

export async function POST(request: Request) {
  try {
    await requireStressInjectionUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect stress injection.");
  }
}
