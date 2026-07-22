import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireObservabilityOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityOperationsUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load observability ledger."); } }
export async function POST(request: Request) { try { await requireObservabilityOperationsUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load observability ledger."); } }
