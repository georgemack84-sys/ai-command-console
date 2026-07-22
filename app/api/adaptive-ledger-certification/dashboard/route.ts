import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, inspectRequest, requireAdaptiveLedgerUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdaptiveLedgerUser(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect adaptive ledger certification."); } }
export async function POST(request: Request) { try { await requireAdaptiveLedgerUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to certify adaptive ledger."); } }
