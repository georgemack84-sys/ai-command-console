import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashPolicyLineageRequest, requirePolicyLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyLineageUser();
    return apiSuccess(await hashPolicyLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash policy lineage reconstruction.");
  }
}
