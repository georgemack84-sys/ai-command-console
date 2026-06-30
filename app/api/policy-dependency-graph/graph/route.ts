import { apiError, apiSuccess } from "@/src/server/api/response";
import { generatePolicyGraphRequest, requirePolicyGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyGraphUser();
    return apiSuccess(await generatePolicyGraphRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate PolicyDependencyGraph.");
  }
}
