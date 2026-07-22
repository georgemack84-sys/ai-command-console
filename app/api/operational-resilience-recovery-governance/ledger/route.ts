import { ledgerRequest, requireOperationalResilienceRecoveryGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to read incident ledger."); } }
export async function POST(request: Request) { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to read incident ledger."); } }
