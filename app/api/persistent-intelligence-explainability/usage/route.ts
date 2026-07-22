import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExplainabilityUser, usageRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(await usageRequest()); } catch (error) { return apiError(error, "Unable to inspect explainability usage intelligence."); } }
export async function POST(request: Request) { try { await requireExplainabilityUser(); return apiSuccess(await usageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect explainability usage intelligence."); } }
