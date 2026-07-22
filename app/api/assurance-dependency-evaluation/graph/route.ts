import { apiError, apiSuccess } from "@/src/server/api/response";
import { graphRequest, requireAssuranceDependencyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceDependencyUser(); return apiSuccess(await graphRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance dependency graph."); } }
export async function POST(request: Request) { try { await requireAssuranceDependencyUser(); return apiSuccess(await graphRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance dependency graph."); } }
