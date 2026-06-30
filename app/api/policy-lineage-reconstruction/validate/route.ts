import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyLineageUser, validatePolicyLineageRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyLineageUser();
    return apiSuccess(await validatePolicyLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate policy lineage reconstruction.");
  }
}
