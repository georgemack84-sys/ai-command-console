import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireDashboardSecurityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDashboardSecurityUser(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect dashboard security visibility."); } }
export async function POST(request: Request) { try { await requireDashboardSecurityUser(); return apiSuccess(await inspectRequest(request)); } catch (error) { return apiError(error, "Unable to inspect dashboard security visibility."); } }
