import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireLearningAdaptationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLearningAdaptationUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF learning registry."); } }
export async function POST(request: Request) { try { await requireLearningAdaptationUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF learning registry."); } }
