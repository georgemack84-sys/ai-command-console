import { impactRequest, requireAdaptationSimulationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationSimulationUser(); return apiSuccess(await impactRequest()); } catch (error) { return apiError(error, "Unable to read operational impact simulation."); } }
export async function POST(request: Request) { try { await requireAdaptationSimulationUser(); return apiSuccess(await impactRequest(request)); } catch (error) { return apiError(error, "Unable to read operational impact simulation."); } }
