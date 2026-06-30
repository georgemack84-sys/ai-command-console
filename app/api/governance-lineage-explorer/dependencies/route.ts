import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceLineageExplorerUser, viewForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceLineageExplorerUser(); const view = viewForRequest(request); return apiSuccess({ dependency_chains: view.dependency_chains, missing_dependencies: view.missing_dependencies, circular_dependencies: view.circular_dependencies }); } catch (error) { return apiError(error, "Unable to retrieve governance dependencies."); } }
