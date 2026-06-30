import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectAutonomyCrossReferenceSearchRequest, requireAutonomyCrossReferenceSearchUser, validateAutonomyCrossReferenceSearchRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireAutonomyCrossReferenceSearchUser(); return apiSuccess(await inspectAutonomyCrossReferenceSearchRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Autonomy Cross-Reference Search."); }
}
export async function POST(request: Request) {
  try { await requireAutonomyCrossReferenceSearchUser(); return apiSuccess({ validation: await validateAutonomyCrossReferenceSearchRequest(request), observability: await inspectAutonomyCrossReferenceSearchRequest(request) }); }
  catch (error) { return apiError(error, "Unable to validate Autonomy Cross-Reference Search."); }
}
