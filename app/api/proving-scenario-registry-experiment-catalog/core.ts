import { getProvingScenarioRegistryExperimentCatalogBundle, runProvingScenarioRegistryExperimentCatalog, validateProvingScenarioRegistryExperimentCatalog } from "@/services/proving-scenario-registry-experiment-catalog";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProvingRegistryInput, ProvingRegistryResult } from "@/types/proving-scenario-registry-experiment-catalog";

export async function requireProvingRegistryUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProvingRegistryInput { return body as ProvingRegistryInput; }
function resultFromBody(body: Record<string, unknown>): ProvingRegistryResult { return (body.result as ProvingRegistryResult | undefined) ?? runProvingScenarioRegistryExperimentCatalog(inputFromBody(body)); }
export function contractResponse() { return getProvingScenarioRegistryExperimentCatalogBundle(); }
export async function validateRequest(request: Request) { return validateProvingScenarioRegistryExperimentCatalog(resultFromBody(await readBody(request))); }
export async function scenariosRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { scenario_registry: result.scenario_registry }; }
export async function experimentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { experiment_catalog: result.experiment_catalog }; }
export async function benchmarksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { benchmark_registry: result.benchmark_registry }; }
export async function exercisesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { exercise_registry: result.exercise_registry }; }
export async function validationSuitesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { validation_catalog: result.validation_catalog, relationships: result.relationships }; }
export async function searchRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { services: result.services, searchable_artifacts: [...result.scenario_registry, ...result.experiment_catalog, ...result.benchmark_registry, ...result.exercise_registry, ...result.validation_catalog].length }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { dependencies: result.scenario_registry.flatMap((scenario) => scenario.dependencies), relationships: result.relationships }; }
export async function versionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { versioning: result.versioning }; }
export async function archiveRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { archive_supported: result.services.version_management && result.governance.lifecycle_status, immutable_versions: result.versioning.historical_versions_immutable }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingScenarioRegistryExperimentCatalog(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
