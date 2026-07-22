import { apiError, apiSuccess } from "@/src/server/api/response";
import { recoveryRequest, requireOperationsIncidentGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOperationsIncidentGovernanceUser(); return apiSuccess(await recoveryRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF recovery governance."); } }
export async function POST(request: Request) { try { await requireOperationsIncidentGovernanceUser(); return apiSuccess(await recoveryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF recovery governance."); } }
