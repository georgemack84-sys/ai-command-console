import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requirePlatformAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformAssuranceUser(); return apiSuccess(await reportRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF assurance report."); } }
export async function POST(request: Request) { try { await requirePlatformAssuranceUser(); return apiSuccess(await reportRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF assurance report."); } }
