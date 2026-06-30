import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPolicyLineageRequest, requirePolicyLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyLineageUser();
    return apiSuccess(await inspectPolicyLineageRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect policy lineage reconstruction.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePolicyLineageUser();
    return apiSuccess(await inspectPolicyLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect policy lineage reconstruction.");
  }
}
