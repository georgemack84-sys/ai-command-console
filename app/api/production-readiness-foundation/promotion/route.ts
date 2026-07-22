import { apiError, apiSuccess } from "@/src/server/api/response";
import { promotionRequest, requireProductionReadinessFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await promotionRequest()); } catch (error) { return apiError(error, "Unable to load production promotion rules."); } }
export async function POST(request: Request) { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await promotionRequest(request)); } catch (error) { return apiError(error, "Unable to load production promotion rules."); } }
