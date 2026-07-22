import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requirePlatformAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformAssuranceUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF platform assurance certification."); } }
export async function POST(request: Request) { try { await requirePlatformAssuranceUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF platform assurance certification."); } }
