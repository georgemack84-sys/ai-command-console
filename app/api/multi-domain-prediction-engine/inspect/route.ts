import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireMultiDomainUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMultiDomainUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect multi-domain prediction engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireMultiDomainUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect multi-domain prediction engine.");
  }
}
