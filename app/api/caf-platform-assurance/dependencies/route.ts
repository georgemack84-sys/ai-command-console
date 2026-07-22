import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependenciesRequest, requirePlatformAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformAssuranceUser(); return apiSuccess(await dependenciesRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF dependency assurance."); } }
export async function POST(request: Request) { try { await requirePlatformAssuranceUser(); return apiSuccess(await dependenciesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF dependency assurance."); } }
