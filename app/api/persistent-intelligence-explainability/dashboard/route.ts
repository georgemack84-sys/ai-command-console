import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to inspect persistent intelligence explainability."); } }
export async function POST(request: Request) { try { await requireExplainabilityUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to run persistent intelligence explainability."); } }
