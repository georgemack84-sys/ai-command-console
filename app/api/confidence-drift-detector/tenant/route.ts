import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConfidenceDriftUser, tenantRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDriftUser();
    return apiSuccess(await tenantRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve tenant confidence drift.");
  }
}
