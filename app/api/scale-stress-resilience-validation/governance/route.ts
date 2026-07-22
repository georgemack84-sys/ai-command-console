import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireScaleStressResilienceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScaleStressResilienceUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to load scale governance."); } }
export async function POST(request: Request) { try { await requireScaleStressResilienceUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to load scale governance."); } }
