import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCrossMissionGraphUser, traversalRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireCrossMissionGraphUser(); return apiSuccess(await traversalRequest()); } catch (error) { return apiError(error, "Unable to traverse cross-mission intelligence graph."); } }
export async function POST(request: Request) { try { await requireCrossMissionGraphUser(); return apiSuccess(await traversalRequest(request)); } catch (error) { return apiError(error, "Unable to traverse cross-mission intelligence graph."); } }
