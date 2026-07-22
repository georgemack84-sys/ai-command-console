import { apiError, apiSuccess } from "@/src/server/api/response";
import { consolidationRequest, requireStrategyCandidateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyCandidateUser(); return apiSuccess(await consolidationRequest()); } catch (error) { return apiError(error, "Unable to consolidate candidate set."); } }
export async function POST(request: Request) { try { await requireStrategyCandidateUser(); return apiSuccess(await consolidationRequest(request)); } catch (error) { return apiError(error, "Unable to consolidate candidate set."); } }
