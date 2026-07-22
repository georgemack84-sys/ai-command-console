import { apiError, apiSuccess } from "@/src/server/api/response";
import { queryRequest, requireCrossMissionGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireCrossMissionGraphUser(); return apiSuccess(await queryRequest()); } catch (error) { return apiError(error, "Unable to query cross-mission intelligence graph."); } }
export async function POST(request: Request) { try { await requireCrossMissionGraphUser(); return apiSuccess(await queryRequest(request)); } catch (error) { return apiError(error, "Unable to query cross-mission intelligence graph."); } }
