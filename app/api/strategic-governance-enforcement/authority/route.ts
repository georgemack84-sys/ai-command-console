import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityRequest, requireStrategicGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await authorityRequest()); } catch (error) { return apiError(error, "Unable to resolve strategic authority."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await authorityRequest(request)); } catch (error) { return apiError(error, "Unable to resolve strategic authority."); } }
