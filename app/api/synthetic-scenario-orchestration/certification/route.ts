import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireSyntheticScenarioOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load synthetic scenario certification."); } }
export async function POST(request: Request) { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic scenario certification."); } }
