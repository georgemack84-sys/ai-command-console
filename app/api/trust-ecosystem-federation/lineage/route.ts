import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to load Federation lineage validation."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to validate Federation lineage."); } }
