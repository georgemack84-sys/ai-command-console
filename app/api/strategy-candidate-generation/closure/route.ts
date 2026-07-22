import { apiError, apiSuccess } from "@/src/server/api/response";
import { closureRequest, requireStrategyCandidateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyCandidateUser(); return apiSuccess(await closureRequest()); } catch (error) { return apiError(error, "Unable to close candidate set."); } }
export async function POST(request: Request) { try { await requireStrategyCandidateUser(); return apiSuccess(await closureRequest(request)); } catch (error) { return apiError(error, "Unable to close candidate set."); } }
