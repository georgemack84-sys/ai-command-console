import { governanceRequest, requireAdaptationSimulationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationSimulationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to read simulation governance."); } }
export async function POST(request: Request) { try { await requireAdaptationSimulationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to read simulation governance."); } }
