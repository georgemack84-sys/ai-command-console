import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requirePlatformAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformAssuranceUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF evidence assurance."); } }
export async function POST(request: Request) { try { await requirePlatformAssuranceUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF evidence assurance."); } }
