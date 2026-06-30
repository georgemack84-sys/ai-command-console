import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyGraphUser, snapshotPolicyGraphRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyGraphUser();
    return apiSuccess(await snapshotPolicyGraphRequest(request));
  } catch (error) {
    return apiError(error, "Unable to snapshot PolicyDependencyGraph.");
  }
}
