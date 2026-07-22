import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustMonitoringUser, rulesRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await rulesRequest()); } catch (error) { return apiError(error, "Unable to load Trust Monitoring rules."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await rulesRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Monitoring rules."); } }
