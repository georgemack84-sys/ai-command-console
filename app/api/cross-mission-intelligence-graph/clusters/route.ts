import { apiError, apiSuccess } from "@/src/server/api/response";
import { clustersRequest, requireCrossMissionGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireCrossMissionGraphUser(); return apiSuccess(await clustersRequest()); } catch (error) { return apiError(error, "Unable to retrieve cross-mission intelligence clusters."); } }
export async function POST(request: Request) { try { await requireCrossMissionGraphUser(); return apiSuccess(await clustersRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve cross-mission intelligence clusters."); } }
