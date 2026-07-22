import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await authorityRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF authority qualification."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await authorityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF authority qualification."); } }
