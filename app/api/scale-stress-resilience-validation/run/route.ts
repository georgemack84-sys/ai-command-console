import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireScaleStressResilienceUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScaleStressResilienceUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run scale stress resilience validation."); } }
export async function POST(request: Request) { try { await requireScaleStressResilienceUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run scale stress resilience validation."); } }
