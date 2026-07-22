import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF program readiness."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF program readiness."); } }
