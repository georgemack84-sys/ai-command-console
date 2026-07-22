import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireStrategyCandidateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyCandidateUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to retrieve candidate lineage."); } }
export async function POST(request: Request) { try { await requireStrategyCandidateUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve candidate lineage."); } }
