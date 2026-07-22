import { certificationRequest, requirePilotExpansionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance certification."); } }
export async function POST(request: Request) { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance certification."); } }
