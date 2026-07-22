import { apiError, apiSuccess } from "@/src/server/api/response";
import { identitiesRequest, requireSyntheticIdentityDataGenerationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await identitiesRequest()); } catch (error) { return apiError(error, "Unable to load synthetic identities."); } }
export async function POST(request: Request) { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await identitiesRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic identities."); } }
