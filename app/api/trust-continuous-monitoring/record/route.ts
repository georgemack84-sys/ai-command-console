import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordRequest, requireTrustMonitoringUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await recordRequest()); } catch (error) { return apiError(error, "Unable to load Trust Monitoring record."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await recordRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Monitoring record."); } }
