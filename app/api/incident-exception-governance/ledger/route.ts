import { ledgerRequest, requireIncidentExceptionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance ledger."); } }
export async function POST(request: Request) { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance ledger."); } }
