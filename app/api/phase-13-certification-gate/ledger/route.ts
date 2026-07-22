import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requirePhase13CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase13CertificationUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to retrieve Phase 13 certification ledger."); } }
export async function POST(request: Request) { try { await requirePhase13CertificationUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve Phase 13 certification ledger."); } }
