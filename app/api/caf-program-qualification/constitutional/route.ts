import { apiError, apiSuccess } from "@/src/server/api/response";
import { constitutionalRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await constitutionalRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF constitutional qualification."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await constitutionalRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF constitutional qualification."); } }
