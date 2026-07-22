import { contractResponse, requireAdaptationSimulationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationSimulationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Adaptation Simulation Engine contract."); } }
