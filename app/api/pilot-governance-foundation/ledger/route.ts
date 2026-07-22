import { ledgerRequest, requirePilotGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotGovernanceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Governance ledger."); } }
export async function POST(request: Request) { try { await requirePilotGovernanceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Governance ledger."); } }
