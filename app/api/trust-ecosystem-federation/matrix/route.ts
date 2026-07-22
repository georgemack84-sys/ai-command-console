import { apiError, apiSuccess } from "@/src/server/api/response";
import { matrixRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await matrixRequest()); } catch (error) { return apiError(error, "Unable to load Federation matrix."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await matrixRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation matrix."); } }
