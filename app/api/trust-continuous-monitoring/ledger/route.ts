import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireTrustMonitoringUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Trust Monitoring ledger."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Monitoring ledger."); } }
