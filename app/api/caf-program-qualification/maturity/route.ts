import { apiError, apiSuccess } from "@/src/server/api/response";
import { maturityRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await maturityRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF platform maturity."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await maturityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF platform maturity."); } }
