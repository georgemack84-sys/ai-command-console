import { counterfactualRequest, requireAdaptationSimulationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationSimulationUser(); return apiSuccess(await counterfactualRequest()); } catch (error) { return apiError(error, "Unable to read counterfactual simulation."); } }
export async function POST(request: Request) { try { await requireAdaptationSimulationUser(); return apiSuccess(await counterfactualRequest(request)); } catch (error) { return apiError(error, "Unable to read counterfactual simulation."); } }
