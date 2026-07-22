import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireCrossMissionGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireCrossMissionGraphUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to inspect cross-mission intelligence graph."); } }
export async function POST(request: Request) { try { await requireCrossMissionGraphUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to build cross-mission intelligence graph."); } }
