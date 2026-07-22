import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireStrategicGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to qualify strategic evidence."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to qualify strategic evidence."); } }
