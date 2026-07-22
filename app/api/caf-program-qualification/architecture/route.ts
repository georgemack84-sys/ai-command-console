import { apiError, apiSuccess } from "@/src/server/api/response";
import { architectureRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await architectureRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF architecture qualification."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await architectureRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF architecture qualification."); } }
