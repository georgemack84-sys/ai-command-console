import { apiError, apiSuccess } from "@/src/server/api/response";
import { frameworkRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await frameworkRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF qualification framework."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await frameworkRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF qualification framework."); } }
