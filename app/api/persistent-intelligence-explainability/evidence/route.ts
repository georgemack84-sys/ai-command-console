import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect explainability evidence trace."); } }
export async function POST(request: Request) { try { await requireExplainabilityUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect explainability evidence trace."); } }
