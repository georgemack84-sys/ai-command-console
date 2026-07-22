import { apiError, apiSuccess } from "@/src/server/api/response";
import { namespaceRequest, requireCafConstitutionalFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCafConstitutionalFoundationUser(); return apiSuccess(await namespaceRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF namespace registry."); } }
export async function POST(request: Request) { try { await requireCafConstitutionalFoundationUser(); return apiSuccess(await namespaceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF namespace registry."); } }
