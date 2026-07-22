import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireScaleStressResilienceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScaleStressResilienceUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load scale evidence."); } }
export async function POST(request: Request) { try { await requireScaleStressResilienceUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to load scale evidence."); } }
