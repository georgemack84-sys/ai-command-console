import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireCrossMissionGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireCrossMissionGraphUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to retrieve cross-mission intelligence graph observability."); } }
export async function POST(request: Request) { try { await requireCrossMissionGraphUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect cross-mission intelligence graph observability."); } }
