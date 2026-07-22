import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategicGovernanceUser, trustRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await trustRequest()); } catch (error) { return apiError(error, "Unable to qualify strategic trust."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await trustRequest(request)); } catch (error) { return apiError(error, "Unable to qualify strategic trust."); } }
