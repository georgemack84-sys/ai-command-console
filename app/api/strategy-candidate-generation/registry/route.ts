import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireStrategyCandidateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyCandidateUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect strategy registry."); } }
export async function POST(request: Request) { try { await requireStrategyCandidateUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategy registry."); } }
