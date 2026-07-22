import { apiError, apiSuccess } from "@/src/server/api/response";
import { operationsRequest, requireTrustMonitoringUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await operationsRequest()); } catch (error) { return apiError(error, "Unable to load operational Trust Monitoring report."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await operationsRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate operational Trust Monitoring report."); } }
