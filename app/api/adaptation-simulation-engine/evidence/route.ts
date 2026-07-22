import { evidenceRequest, requireAdaptationSimulationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationSimulationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read simulation evidence."); } }
export async function POST(request: Request) { try { await requireAdaptationSimulationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read simulation evidence."); } }
