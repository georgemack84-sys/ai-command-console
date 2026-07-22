import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireScaleStressResilienceUser, workloadsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScaleStressResilienceUser(); return apiSuccess(await workloadsRequest()); } catch (error) { return apiError(error, "Unable to load scale workloads."); } }
export async function POST(request: Request) { try { await requireScaleStressResilienceUser(); return apiSuccess(await workloadsRequest(request)); } catch (error) { return apiError(error, "Unable to load scale workloads."); } }
