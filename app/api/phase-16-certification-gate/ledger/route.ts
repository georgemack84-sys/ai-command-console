import { ledgerRequest, requirePhase16CertificationGateUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePhase16CertificationGateUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Phase 16 certification ledger."); } }
export async function POST(request: Request) { try { await requirePhase16CertificationGateUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Phase 16 certification ledger."); } }
