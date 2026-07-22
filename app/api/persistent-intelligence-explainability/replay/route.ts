import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to inspect explainability replay lineage."); } }
export async function POST(request: Request) { try { await requireExplainabilityUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to inspect explainability replay lineage."); } }
