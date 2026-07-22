import { apiError, apiSuccess } from "@/src/server/api/response";
import { interoperabilityRequest, requireProgramQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgramQualificationUser(); return apiSuccess(await interoperabilityRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF interoperability qualification."); } }
export async function POST(request: Request) { try { await requireProgramQualificationUser(); return apiSuccess(await interoperabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF interoperability qualification."); } }
