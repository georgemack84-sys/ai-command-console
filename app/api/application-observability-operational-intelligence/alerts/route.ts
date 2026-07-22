import { apiError, apiSuccess } from "@/src/server/api/response";
import { alertsRequest, requireApplicationOperationalUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationOperationalUser(); return apiSuccess(await alertsRequest()); } catch (error) { return apiError(error, "Unable to inspect operational alert views."); } }
export async function POST(request: Request) { try { await requireApplicationOperationalUser(); return apiSuccess(await alertsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect operational alert views."); } }
