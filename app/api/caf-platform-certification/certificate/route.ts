import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificateRequest, requirePlatformCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformCertificationUser(); return apiSuccess(await certificateRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF platform certificate."); } }
export async function POST(request: Request) { try { await requirePlatformCertificationUser(); return apiSuccess(await certificateRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF platform certificate."); } }
