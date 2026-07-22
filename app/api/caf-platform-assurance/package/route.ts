import { apiError, apiSuccess } from "@/src/server/api/response";
import { packageRequest, requirePlatformAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformAssuranceUser(); return apiSuccess(await packageRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF assurance package."); } }
export async function POST(request: Request) { try { await requirePlatformAssuranceUser(); return apiSuccess(await packageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF assurance package."); } }
