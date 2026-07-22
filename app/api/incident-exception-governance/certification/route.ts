import { certificationRequest, requireIncidentExceptionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance certification."); } }
export async function POST(request: Request) { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance certification."); } }
