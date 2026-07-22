import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityRequest, requireSyntheticValidationFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await identityRequest()); } catch (error) { return apiError(error, "Unable to load synthetic validation identity."); } }
export async function POST(request: Request) { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await identityRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic validation identity."); } }
