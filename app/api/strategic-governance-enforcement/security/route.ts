import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategicGovernanceUser, securityRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await securityRequest()); } catch (error) { return apiError(error, "Unable to validate strategic security."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await securityRequest(request)); } catch (error) { return apiError(error, "Unable to validate strategic security."); } }
