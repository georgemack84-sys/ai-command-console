import { apiError, apiSuccess } from "@/src/server/api/response";
import { ownershipRequest, requireCafConstitutionalFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCafConstitutionalFoundationUser(); return apiSuccess(await ownershipRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF ownership registry."); } }
export async function POST(request: Request) { try { await requireCafConstitutionalFoundationUser(); return apiSuccess(await ownershipRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF ownership registry."); } }
