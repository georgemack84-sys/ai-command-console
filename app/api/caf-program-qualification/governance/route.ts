import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF governance qualification."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF governance qualification."); } }
