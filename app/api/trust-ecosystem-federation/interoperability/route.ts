import { apiError, apiSuccess } from "@/src/server/api/response";
import { interoperabilityRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await interoperabilityRequest()); } catch (error) { return apiError(error, "Unable to load Federation interoperability."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await interoperabilityRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation interoperability."); } }
