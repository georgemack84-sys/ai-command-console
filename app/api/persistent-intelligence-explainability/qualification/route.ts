import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualificationRequest, requireExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to inspect explainability qualification history."); } }
export async function POST(request: Request) { try { await requireExplainabilityUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect explainability qualification history."); } }
