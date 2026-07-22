import { analysisRequest, requireQciUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(await analysisRequest()); } catch (error) { return apiError(error, "Unable to inspect QCI analysis."); } }
export async function POST(request: Request) { try { await requireQciUser(); return apiSuccess(await analysisRequest(request)); } catch (error) { return apiError(error, "Unable to inspect QCI analysis."); } }
