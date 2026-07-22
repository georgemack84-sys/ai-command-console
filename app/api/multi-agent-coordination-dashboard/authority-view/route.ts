import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityViewRequest, requireCoordinationDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationDashboardUser(); return apiSuccess(await authorityViewRequest(request)); }
  catch (error) { return apiError(error, "Unable to load dashboard authority view."); }
}
