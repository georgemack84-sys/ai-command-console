import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityRequest, requireApplicationRegistryCatalogUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await identityRequest()); } catch (error) { return apiError(error, "Unable to inspect application identities."); } }
export async function POST(request: Request) { try { await requireApplicationRegistryCatalogUser(); return apiSuccess(await identityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application identities."); } }
