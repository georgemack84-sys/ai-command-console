import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect explainability governance history."); } }
export async function POST(request: Request) { try { await requireExplainabilityUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect explainability governance history."); } }
