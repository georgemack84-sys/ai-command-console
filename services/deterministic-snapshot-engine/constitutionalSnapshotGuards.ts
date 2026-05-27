import type {
  ConstitutionalSnapshotBuildInput,
  ConstitutionalSnapshotEnvelope,
  ConstitutionalSnapshotError,
  SnapshotType,
} from "@/types/deterministic-snapshot-engine";
import { hashSnapshotValue } from "./snapshotHasher";

const BANNED_IMPORT_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|shell|child_process|adapter|executionEngine|runtimeControl|jobQueue|taskQueue)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|shell|child_process|adapter|executionEngine|runtimeControl|jobQueue|taskQueue)["']\)/i,
  /\bbuildReplayReconstruction\b/,
  /\borchestrateValidation\b/,
  /\bbuildExecutionTreatyPackage\b/,
  /\bappendExecutionTreatyEvent\b/,
] as const;

const BANNED_CALL_PATTERNS = [
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bexecFile\s*\(/,
  /\bfork\s*\(/,
  /\bdispatch\w*\s*\(/i,
  /\brunAdapter\s*\(/,
  /\binvokeAdapter\s*\(/,
  /\benqueue\w*\s*\(/i,
  /\bstartWorker\s*\(/,
  /\bschedule\w*\s*\(/i,
  /\bdelete[A-Z]\w*\s*\(/,
  /\bupdate[A-Z]\w*\s*\(/,
  /\brepair[A-Z]\w*\s*\(/,
  /\bheal[A-Z]\w*\s*\(/,
] as const;

const SNAPSHOT_TYPES: readonly SnapshotType[] = Object.freeze([
  "execution",
  "policy",
  "registry",
  "approval",
  "memory",
  "validation",
  "governance_decision",
  "authorization",
  "revocation",
  "autonomy_classification",
  "adaptation",
]);

export function detectSnapshotMutationViolations(input: {
  sourceTexts: readonly { path: string; content: string }[];
}): { valid: boolean; errors: readonly string[] } {
  const errors: string[] = [];
  for (const source of input.sourceTexts) {
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`SNAPSHOT_IMMUTABILITY_VIOLATION:${source.path}`);
      }
    }
    for (const pattern of BANNED_CALL_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`SNAPSHOT_IMMUTABILITY_VIOLATION:${source.path}`);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  };
}

export function guardSnapshotInput(input: ConstitutionalSnapshotBuildInput): readonly ConstitutionalSnapshotError[] {
  const errors: ConstitutionalSnapshotError[] = [];
  if (!input.snapshotType || !SNAPSHOT_TYPES.includes(input.snapshotType)) {
    errors.push({
      code: "SNAPSHOT_TYPE_INVALID",
      message: "snapshot type is invalid",
      path: "snapshotType",
    });
  }
  if (!input.payload) {
    errors.push({
      code: "SNAPSHOT_PAYLOAD_MISSING",
      message: "snapshot payload is required",
      path: "payload",
    });
  }
  if (!input.missionId || !input.lineageId || !input.createdAt) {
    errors.push({
      code: "SNAPSHOT_SCHEMA_INVALID",
      message: "missionId, lineageId, and createdAt are required",
      path: "input",
    });
  }
  if (!input.sourceArtifacts.treaty && !input.sourceArtifacts.validation && !input.sourceArtifacts.replay) {
    errors.push({
      code: "SNAPSHOT_UNKNOWN_STATE",
      message: "snapshot requires upstream truth artifacts",
      path: "sourceArtifacts",
    });
  }
  if (!input.sourceArtifacts.replay && !input.sourceArtifacts.treaty?.manifest.replayBindingHash) {
    errors.push({
      code: "SNAPSHOT_REPLAY_BINDING_INVALID",
      message: "snapshot requires immutable replay binding evidence",
      path: "sourceArtifacts.replay",
    });
  }
  if (input.sourceArtifacts.revocation && !input.sourceArtifacts.revocation.replayContinuityPreserved) {
    errors.push({
      code: "SNAPSHOT_REVOCATION_INVALID",
      message: "revocation continuity must be preserved",
      path: "sourceArtifacts.revocation",
    });
  }
  return Object.freeze(errors);
}

export function mapSnapshotErrors(input: {
  lineageValid: boolean;
  integrity: { valid: boolean };
  governanceHash: string;
  authorityHash: string;
  legalityHash: string;
  replayHash: string;
}): readonly ConstitutionalSnapshotError[] {
  const errors: ConstitutionalSnapshotError[] = [];
  if (!input.lineageValid) {
    errors.push({
      code: "SNAPSHOT_LINEAGE_INVALID",
      message: "snapshot lineage is invalid",
    });
  }
  if (!input.governanceHash) {
    errors.push({
      code: "SNAPSHOT_GOVERNANCE_INVALID",
      message: "governance binding is missing",
    });
  }
  if (!input.authorityHash) {
    errors.push({
      code: "SNAPSHOT_AUTHORITY_INVALID",
      message: "authority binding is missing",
    });
  }
  if (!input.legalityHash) {
    errors.push({
      code: "SNAPSHOT_LEGALITY_INVALID",
      message: "legality binding is missing",
    });
  }
  if (!input.replayHash) {
    errors.push({
      code: "SNAPSHOT_REPLAY_BINDING_INVALID",
      message: "replay binding is missing",
    });
  }
  if (!input.integrity.valid) {
    errors.push({
      code: "SNAPSHOT_INTEGRITY_INVALID",
      message: "snapshot integrity verification failed",
    });
  }
  return Object.freeze(errors);
}

export function buildFailClosedSnapshot(
  input: Partial<ConstitutionalSnapshotBuildInput>,
  errors: readonly ConstitutionalSnapshotError[],
): ConstitutionalSnapshotEnvelope {
  const payload = Object.freeze({
    kind: input.snapshotType ?? "execution",
    failClosed: true,
    errors,
  });
  const governanceHash = hashSnapshotValue("snapshot-governance-fail-closed", errors);
  const legalityHash = hashSnapshotValue("snapshot-legality-fail-closed", errors);
  const authorityHash = hashSnapshotValue("snapshot-authority-fail-closed", errors);
  const replayHash = hashSnapshotValue("snapshot-replay-fail-closed", errors);
  const payloadHash = hashSnapshotValue("snapshot-payload-fail-closed", payload);
  const schemaHash = hashSnapshotValue("snapshot-schema-fail-closed", input.snapshotType ?? "execution");
  const integrityHash = hashSnapshotValue("snapshot-integrity-fail-closed", {
    governanceHash,
    legalityHash,
    authorityHash,
    replayHash,
    payloadHash,
    schemaHash,
  });
  return Object.freeze({
    snapshotId: hashSnapshotValue("snapshot-id-fail-closed", {
      missionId: input.missionId ?? "unknown-mission",
      lineageId: input.lineageId ?? "unknown-lineage",
      createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z",
    }),
    snapshotType: input.snapshotType ?? "execution",
    missionId: input.missionId ?? "unknown-mission",
    executionId: input.executionId,
    lineageId: input.lineageId ?? "unknown-lineage",
    parentSnapshotId: input.parentSnapshotId,
    branchId: input.branchId,
    autonomyLevel: input.autonomyLevel ?? "A0",
    governanceHash,
    legalityHash,
    authorityHash,
    replayHash,
    payloadHash,
    schemaHash,
    integrityHash,
    revocationEligible: input.revocationEligible ?? true,
    supervisionRequirements: Object.freeze([...(input.supervisionRequirements ?? [])]),
    immutable: true,
    createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z",
    payload,
  });
}
