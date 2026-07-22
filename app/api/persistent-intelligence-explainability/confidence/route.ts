import { apiError, apiSuccess } from "@/src/server/api/response";
import { confidenceRequest, requireExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(await confidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect explainability confidence evolution."); } }
export async function POST(request: Request) { try { await requireExplainabilityUser(); return apiSuccess(await confidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect explainability confidence evolution."); } }
