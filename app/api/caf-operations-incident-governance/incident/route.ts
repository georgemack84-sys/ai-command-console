import { apiError, apiSuccess } from "@/src/server/api/response";
import { incidentRequest, requireOperationsIncidentGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOperationsIncidentGovernanceUser(); return apiSuccess(await incidentRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF incident governance."); } }
export async function POST(request: Request) { try { await requireOperationsIncidentGovernanceUser(); return apiSuccess(await incidentRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF incident governance."); } }
