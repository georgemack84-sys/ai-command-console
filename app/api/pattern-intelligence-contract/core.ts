import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computePatternIdentityHash,
  getPatternIntelligenceContractFoundation,
  replayPatternIntelligenceContract,
  validatePatternIntelligenceContract,
} from "@/services/pattern-intelligence-contract";
import type { PatternContractInput, PatternContractResult } from "@/types/pattern-intelligence-contract";

export async function requirePatternIntelligenceContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getPatternIntelligenceContractResponse() {
  return getPatternIntelligenceContractFoundation();
}

export async function validatePatternIntelligenceContractRequest(request: Request) {
  const body = await readBody(request) as PatternContractInput;
  return validatePatternIntelligenceContract(body);
}

export async function schemaPatternIntelligenceContractRequest(request: Request) {
  const body = await readBody(request) as PatternContractInput;
  return validatePatternIntelligenceContract(body).schema;
}

export async function replayPatternIntelligenceContractRequest(request: Request) {
  const body = await readBody(request) as Partial<PatternContractResult> & PatternContractInput;
  const result = body.contract ? body as PatternContractResult : validatePatternIntelligenceContract(body);
  return {
    replay_valid: replayPatternIntelligenceContract(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function governancePatternIntelligenceContractRequest(request: Request) {
  const body = await readBody(request) as PatternContractInput;
  const result = validatePatternIntelligenceContract(body);
  return {
    governance_validated: result.validation.governance_validated,
    governance_rules: result.contract.governance_rules,
    constitutional_rules: result.contract.constitutional_rules,
    failures: result.validation.failures,
  };
}

export async function identityPatternIntelligenceContractRequest(request: Request) {
  const body = await readBody(request) as PatternContractInput;
  const result = validatePatternIntelligenceContract(body);
  return {
    identity: result.identity,
    identity_hash: computePatternIdentityHash(result.identity),
    immutable: result.identity.immutable,
  };
}

export async function inspectPatternIntelligenceContractRequest(request?: Request) {
  if (!request) return getPatternIntelligenceContractFoundation();
  const body = await readBody(request) as PatternContractInput;
  const result = validatePatternIntelligenceContract(body);
  return {
    contract_status: result.contract.contract_status,
    valid: result.validation.valid,
    failures: result.validation.failures,
    pattern_type: result.schema.pattern_type,
    advisory_only: result.advisory_only,
    autonomous_learning: result.autonomous_learning,
  };
}
