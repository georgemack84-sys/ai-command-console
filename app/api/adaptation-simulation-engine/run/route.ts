import { requireAdaptationSimulationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationSimulationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Adaptation Simulation Engine."); } }
export async function POST(request: Request) { try { await requireAdaptationSimulationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Adaptation Simulation Engine."); } }
