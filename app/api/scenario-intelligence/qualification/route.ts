import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualificationRequest, requireScenarioIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScenarioIntelligenceUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to inspect scenario qualification."); } }
export async function POST(request: Request) { try { await requireScenarioIntelligenceUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect scenario qualification."); } }
