import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProgramQualificationUser, safetyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await safetyRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF safety qualification."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await safetyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF safety qualification."); } }
