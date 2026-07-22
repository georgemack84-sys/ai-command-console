import { certificationRequest, requireAdaptationSimulationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationSimulationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read adaptation simulation certification."); } }
export async function POST(request: Request) { try { await requireAdaptationSimulationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read adaptation simulation certification."); } }
