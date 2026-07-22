import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStrategicGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect strategic governance enforcement contract."); } }
