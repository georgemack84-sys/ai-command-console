import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceConstitutionalUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireGovernanceConstitutionalUser(); return apiSuccess(await sectionRequest(request, "record")); } catch (error) { return apiError(error, "Unable to retrieve governance constitutional certification record."); } }
