import { ledgerRequest, requireAdaptiveGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to read governance ledger."); } }
export async function POST(request: Request) { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to read governance ledger."); } }
