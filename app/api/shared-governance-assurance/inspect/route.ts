import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireSharedGovernanceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireSharedGovernanceUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect shared governance assurance."); }
}
export async function POST(request: Request) {
  try { await requireSharedGovernanceUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect shared governance assurance."); }
}
