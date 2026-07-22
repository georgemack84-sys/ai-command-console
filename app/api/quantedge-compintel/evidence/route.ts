import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireQciUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect QCI evidence and explainability."); } }
export async function POST(request: Request) { try { await requireQciUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect QCI evidence and explainability."); } }
