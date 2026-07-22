import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityRequest, requireApplicationIdentityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIdentityUser(); return apiSuccess(await identityRequest()); } catch (error) { return apiError(error, "Unable to inspect application identity."); } }
export async function POST(request: Request) { try { await requireApplicationIdentityUser(); return apiSuccess(await identityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application identity."); } }
