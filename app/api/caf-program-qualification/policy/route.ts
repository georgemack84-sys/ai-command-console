import { apiError, apiSuccess } from "@/src/server/api/response";
import { policyRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await policyRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF policy qualification."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await policyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF policy qualification."); } }
