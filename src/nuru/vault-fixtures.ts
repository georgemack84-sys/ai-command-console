import { type VaultRecord, vaultSchemaVersion } from "@/src/nuru/vault-contracts";

const createdAt = "2026-09-30T12:00:00.000Z";
const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const successorCorrelationId = "e1c2d3f4-7d22-4d7c-90ab-1f1d7ba1f8ab";
const hash = (character: string) => `sha256:${character.repeat(64)}`;

function chain(prefix: string, interpretation: string, correlation = correlationId): VaultRecord[] {
  const sourceId = `${prefix}-source`;
  const evidenceId = `${prefix}-evidence`;
  const candidateId = `${prefix}-candidate`;
  const decisionId = `${prefix}-decision`;
  return [
    { schemaVersion: vaultSchemaVersion, id: sourceId, kind: "SOURCE", classification: "PUBLIC", createdAt, correlationId: correlation, origin: "Nuru fixture library", authority: "HIGH", policyVersion: "source-policy/v1", retrievedAt: createdAt, contentHash: hash("a") },
    { schemaVersion: vaultSchemaVersion, id: evidenceId, kind: "EVIDENCE", classification: "PUBLIC", createdAt, correlationId: correlation, sourceId, locator: `fixture://${prefix}#evidence`, capturedAt: createdAt, contentHash: hash("b") },
    { schemaVersion: vaultSchemaVersion, id: candidateId, kind: "CANDIDATE", classification: "PUBLIC", createdAt, correlationId: correlation, evidenceIds: [evidenceId], interpretation, confidence: 0.8, producedBy: "nuru.fixture.v1", status: "APPROVED" },
    { schemaVersion: vaultSchemaVersion, id: decisionId, kind: "GOVERNANCE_DECISION", classification: "PUBLIC", createdAt, correlationId: correlation, candidateId, outcome: "APPROVED", decidedBy: "human:fixture-owner", decidedAt: createdAt, rationale: "Fixture provenance chain reviewed.", requiredHumanReview: true, humanApprovalId: `${prefix}-approval` },
  ];
}

const tinyChain = chain("tiny", "A small, evidence-bound discovery.");
export const tinyVaultFixture: VaultRecord[] = [
  ...tinyChain,
  { schemaVersion: vaultSchemaVersion, id: "tiny-canonical", kind: "CANONICAL_RECORD", classification: "PUBLIC", createdAt, correlationId, candidateId: "tiny-candidate", governanceDecisionId: "tiny-decision", version: 1, status: "CURRENT" },
  { schemaVersion: vaultSchemaVersion, id: "tiny-audit", kind: "AUDIT_EVENT", classification: "PUBLIC", createdAt, correlationId, eventType: "CANONICAL_PROMOTED", actor: "nuru.fixture.v1", resourceId: "tiny-canonical", occurredAt: createdAt, reason: "Fixture promotion recorded." },
];

const historicalFirstChain = chain("history-v1", "An original interpretation retained for history.");
const historicalSuccessorChain = chain("history-v2", "The corrected interpretation served by default.", successorCorrelationId);
export const historicalVaultFixture: VaultRecord[] = [
  ...historicalFirstChain,
  { schemaVersion: vaultSchemaVersion, id: "history-canonical-v1", kind: "CANONICAL_RECORD", classification: "PUBLIC", createdAt, correlationId, candidateId: "history-v1-candidate", governanceDecisionId: "history-v1-decision", version: 1, status: "SUPERSEDED", supersededById: "history-canonical-v2" },
  ...historicalSuccessorChain,
  { schemaVersion: vaultSchemaVersion, id: "history-canonical-v2", kind: "CANONICAL_RECORD", classification: "PUBLIC", createdAt, correlationId: successorCorrelationId, candidateId: "history-v2-candidate", governanceDecisionId: "history-v2-decision", version: 2, status: "CURRENT" },
  { schemaVersion: vaultSchemaVersion, id: "history-audit", kind: "AUDIT_EVENT", classification: "PUBLIC", createdAt, correlationId: successorCorrelationId, eventType: "RECORD_SUPERSEDED", actor: "nuru.fixture.v1", resourceId: "history-canonical-v2", occurredAt: createdAt, reason: "Fixture successor recorded without deleting version 1." },
];

const conflictOne = chain("conflict-one", "A first interpretation that remains a candidate.");
const conflictTwo = chain("conflict-two", "An incompatible interpretation that also remains a candidate.");
export const conflictedVaultFixture: VaultRecord[] = [...conflictOne, ...conflictTwo];

/** Deliberately invalid records used to prove the contract boundary rejects hostile or incomplete input. */
export const poisonedVaultFixture: unknown[] = [
  { schemaVersion: "nuru.vault/v0", id: "poisoned-version", kind: "SOURCE", classification: "PUBLIC", createdAt, correlationId, origin: "Untrusted fixture", authority: "LOW", policyVersion: "source-policy/v1", retrievedAt: createdAt, contentHash: hash("c") },
  { schemaVersion: vaultSchemaVersion, id: "poisoned-candidate", kind: "CANDIDATE", classification: "PUBLIC", createdAt, correlationId, evidenceIds: [], interpretation: "<script>not executable fixture data</script>", confidence: 0.5, producedBy: "untrusted", status: "PROPOSED" },
  { schemaVersion: vaultSchemaVersion, id: "poisoned-supersession", kind: "CANONICAL_RECORD", classification: "PUBLIC", createdAt, correlationId, candidateId: "missing", governanceDecisionId: "missing", version: 1, status: "SUPERSEDED" },
];
