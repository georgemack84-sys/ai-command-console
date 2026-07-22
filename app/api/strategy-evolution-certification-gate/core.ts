import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyStrategyEvolution,
  getStrategyEvolutionCertificationFoundation,
  replayStrategyEvolutionCertification,
} from "@/services/strategy-evolution-certification-gate";
import type { StrategyEvolutionCertificationInput, StrategyEvolutionCertificationResult } from "@/types/strategy-evolution-certification-gate";

export async function requireStrategyEvolutionCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getStrategyEvolutionCertificationFoundation();
}

export async function certifyRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  return certifyStrategyEvolution(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  return certifyStrategyEvolution(body).certification_records;
}

export async function decisionRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  const result = certifyStrategyEvolution(body);
  return {
    certification_outcome: result.certification_outcome,
    production_ready: result.production_ready,
    failures: result.validation.failures,
  };
}

export async function functionalRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  return certifyStrategyEvolution(body).certification_records.map((record) => ({
    certification_id: record.certification_id,
    functional_validation_status: record.functional_validation_status,
    failed_test_refs: record.failed_test_refs,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  return certifyStrategyEvolution(body).certification_records.map((record) => ({
    certification_id: record.certification_id,
    governance_validation_status: record.governance_validation_status,
  }));
}

export async function constitutionalRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  return certifyStrategyEvolution(body).certification_records.map((record) => ({
    certification_id: record.certification_id,
    constitutional_validation_status: record.constitutional_validation_status,
    advisory_only_verified: record.advisory_only_verified,
    mutation_blocked: record.mutation_blocked,
  }));
}

export async function simulationRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  return certifyStrategyEvolution(body).certification_records.map((record) => ({
    certification_id: record.certification_id,
    simulation_validation_status: record.simulation_validation_status,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<StrategyEvolutionCertificationResult> & StrategyEvolutionCertificationInput;
  if (body.registry) {
    const result = body as StrategyEvolutionCertificationResult;
    return {
      replay_valid: replayStrategyEvolutionCertification(result),
      replay_hash: result.replay_hash,
      integrity_hash: result.integrity_hash,
    };
  }
  const result = certifyStrategyEvolution(body);
  return {
    replay_valid: replayStrategyEvolutionCertification(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function integrityRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  const result = certifyStrategyEvolution(body);
  return {
    integrity_validated: result.validation.integrity_validated,
    integrity_verified: result.validation.integrity_verified,
    integrity_hash: result.integrity_hash,
    failures: result.validation.failures,
  };
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  return certifyStrategyEvolution(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getStrategyEvolutionCertificationFoundation();
  const body = await readBody(request) as StrategyEvolutionCertificationInput;
  const result = certifyStrategyEvolution(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    certification_outcome: result.certification_outcome,
    production_ready: result.production_ready,
    failures: result.validation.failures,
  };
}
