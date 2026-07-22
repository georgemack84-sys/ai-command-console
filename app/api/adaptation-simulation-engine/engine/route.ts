import { engineRequest, requireAdaptationSimulationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationSimulationUser(); return apiSuccess(await engineRequest()); } catch (error) { return apiError(error, "Unable to read simulation engine."); } }
export async function POST(request: Request) { try { await requireAdaptationSimulationUser(); return apiSuccess(await engineRequest(request)); } catch (error) { return apiError(error, "Unable to read simulation engine."); } }
