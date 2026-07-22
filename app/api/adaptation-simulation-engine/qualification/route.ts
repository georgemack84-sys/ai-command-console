import { qualificationRequest, requireAdaptationSimulationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationSimulationUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to read simulation qualification."); } }
export async function POST(request: Request) { try { await requireAdaptationSimulationUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to read simulation qualification."); } }
