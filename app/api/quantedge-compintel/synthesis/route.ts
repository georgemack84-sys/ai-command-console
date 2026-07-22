import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireQciUser, synthesisRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(await synthesisRequest()); } catch (error) { return apiError(error, "Unable to inspect QCI synthesis."); } }
export async function POST(request: Request) { try { await requireQciUser(); return apiSuccess(await synthesisRequest(request)); } catch (error) { return apiError(error, "Unable to inspect QCI synthesis."); } }
