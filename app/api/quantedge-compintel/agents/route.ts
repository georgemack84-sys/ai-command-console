import { agentsRequest, requireQciUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(await agentsRequest()); } catch (error) { return apiError(error, "Unable to inspect QCI agent integration."); } }
export async function POST(request: Request) { try { await requireQciUser(); return apiSuccess(await agentsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect QCI agent integration."); } }
