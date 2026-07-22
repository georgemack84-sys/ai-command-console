export type PersistentIntelligenceStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type PersistentIntelligenceLifecycleStage = "DRAFT" | "CANDIDATE" | "QUALIFIED" | "CERTIFIED" | "PERSISTENT" | "DEPRECATED" | "ARCHIVED" | "RETIRED";
export type PersistentIntelligenceVersionType = "MAJOR" | "MINOR" | "PATCH" | "CERTIFICATION" | "GOVERNANCE" | "RETIREMENT";
export type PersistentIntelligenceTrustTier = "UNQUALIFIED" | "QUALIFIED" | "CERTIFIED" | "PERSISTENT";
export type PersistentIntelligenceFailure =
  | "CONTRACT_INVALID"
  | "IDENTITY_MUTATION"
  | "DUPLICATE_IDENTITY"
  | "SCHEMA_NONDETERMINISTIC"
  | "VERSION_LINEAGE_INVALID"
  | "REGISTRY_CORRUPTION"
  | "QUALIFICATION_BYPASS"
  | "API_AUTHORIZATION_FAILURE"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "TENANT_ISOLATION_BREACH"
  | "REPLAY_INCONSISTENCY"
  | "LEDGER_MUTATION"
  | "INTEGRITY_HASH_MISMATCH"
  | "SIGNATURE_INVALID"
  | "OBSERVABILITY_INCOMPLETE"
  | "ALERTING_INOPERABLE"
  | "PERFORMANCE_THRESHOLD_MISSED"
  | "SECURITY_TEST_FAILURE"
  | "RECOVERY_NONDETERMINISTIC"
  | "PRODUCTION_READINESS_BLOCKED";
export type PersistentIntelligenceScenario = "BASELINE" | PersistentIntelligenceFailure;

export type PersistentIntelligenceIdentity = Readonly<{
  intelligence_id: string;
  version_id: string;
  parent_id: string | null;
  root_intelligence_id: string;
  tenant_id: string;
  mission_id: string;
  classification_id: string;
  trust_tier: PersistentIntelligenceTrustTier;
  qualification_id: string;
  immutable: true;
  integrity_hash: string;
}>;

export type PersistentIntelligenceContract = Readonly<{
  contract_id: string;
  lifecycle: readonly PersistentIntelligenceLifecycleStage[];
  ownership_required: true;
  constitutional_authority_required: boolean;
  governance_approval_required: boolean;
  trust_qualification_required: boolean;
  evidence_required: true;
  replay_required: boolean;
  tenant_isolation_required: boolean;
  advisory_only: true;
  memory_substitute: false;
  persistence_rule: "ONLY_CERTIFIED_QUALIFIED_INTELLIGENCE_CAN_BECOME_PERSISTENT";
  retirement_policy: "RETIRED_ASSETS_REMAIN_REPLAYABLE_AND_AUDITABLE";
  restoration_policy: "RESTORATION_REQUIRES_GOVERNANCE_AND_REPLAY_CERTIFICATION";
  integrity_hash: string;
}>;

export type PersistentKnowledgeSchema = Readonly<{
  schema_id: string;
  schema_version: "persistent-knowledge-schema/v11.1";
  domains: readonly ("METADATA" | "INTELLIGENCE" | "EVIDENCE" | "GOVERNANCE" | "LIFECYCLE")[];
  fields: Readonly<{
    metadata: readonly string[];
    intelligence: readonly string[];
    evidence: readonly string[];
    governance: readonly string[];
    lifecycle: readonly string[];
  }>;
  deterministic_serialization: boolean;
  backward_compatible: true;
  migration_framework_available: true;
  integrity_hash: string;
}>;

export type PersistentIntelligenceVersion = Readonly<{
  version_id: string;
  intelligence_id: string;
  version_number: string;
  version_type: PersistentIntelligenceVersionType;
  parent_version_id: string | null;
  immutable: true;
  replayable: true;
  traceable: true;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type PersistentIntelligenceRegistryEntry = Readonly<{
  registry_id: string;
  identity: PersistentIntelligenceIdentity;
  lifecycle_stage: PersistentIntelligenceLifecycleStage;
  qualification_status: PersistentIntelligenceTrustTier;
  governance_status: "APPROVED";
  constitutional_status: "APPROVED";
  dependencies: readonly string[];
  searchable_terms: readonly string[];
  tenant_isolated: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type PersistentIntelligenceQualificationInterface = Readonly<{
  interface_id: string;
  validates_contract: boolean;
  validates_governance: boolean;
  validates_constitution: boolean;
  validates_trust: boolean;
  validates_replay: boolean;
  validates_tenant_isolation: boolean;
  blocks_unqualified_persistence: boolean;
  integrity_hash: string;
}>;

export type PersistentIntelligenceApiSurface = Readonly<{
  api_id: string;
  registration: readonly string[];
  discovery: readonly string[];
  validation: readonly string[];
  administration: readonly string[];
  authorization_required: boolean;
  constitutional_validation_required: boolean;
  governance_validation_required: boolean;
  tenant_isolation_required: boolean;
  replay_logging_required: boolean;
  audit_logging_required: boolean;
  mutation_without_version_supported: false;
  integrity_hash: string;
}>;

export type PersistentIntelligenceObservability = Readonly<{
  observability_id: string;
  metrics: Readonly<{
    registrations: number;
    qualifications: number;
    version_creations: number;
    lookup_latency_ms: number;
    replay_latency_ms: number;
    api_performance_ms: number;
  }>;
  dashboards: readonly ("REGISTRY_HEALTH" | "QUALIFICATION_HEALTH" | "VERSION_GROWTH" | "GOVERNANCE_STATUS" | "REPLAY_VALIDATION" | "CERTIFICATION_READINESS")[];
  alerts: readonly ("REGISTRY_FAILURE" | "DUPLICATE_IDENTITY" | "VERSION_CONFLICT" | "REPLAY_FAILURE" | "GOVERNANCE_VIOLATION" | "INTEGRITY_FAILURE")[];
  ledger_complete: boolean;
  integrity_hash: string;
}>;

export type PersistentIntelligenceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: string;
  intelligence_id: string;
  version_id: string;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: boolean;
  integrity_hash: string;
}>;

export type PersistentIntelligenceCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: PersistentIntelligenceFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PersistentIntelligenceCertification = Readonly<{
  certification_id: string;
  status: PersistentIntelligenceStatus;
  production_ready: boolean;
  foundation_allows_object_creation: boolean;
  failures: readonly PersistentIntelligenceFailure[];
  tests: readonly PersistentIntelligenceCertificationTest[];
  integrity_hash: string;
}>;

export type PersistentIntelligenceFoundationInput = Readonly<{
  scenario?: PersistentIntelligenceScenario;
  tenant_id?: string;
  mission_id?: string;
}>;

export type PersistentIntelligenceFoundationResult = Readonly<{
  foundation_version: "persistent-intelligence-foundation/v11.1";
  foundation_identifier: "PersistentIntelligenceFoundation";
  status: PersistentIntelligenceStatus;
  contract: PersistentIntelligenceContract;
  identity: PersistentIntelligenceIdentity;
  schema: PersistentKnowledgeSchema;
  versions: readonly PersistentIntelligenceVersion[];
  registry: readonly PersistentIntelligenceRegistryEntry[];
  qualification_interface: PersistentIntelligenceQualificationInterface;
  api_surface: PersistentIntelligenceApiSurface;
  observability: PersistentIntelligenceObservability;
  ledger: readonly PersistentIntelligenceLedgerEntry[];
  certification: PersistentIntelligenceCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PersistentIntelligenceValidation = Readonly<{
  foundation_id: string | null;
  valid: boolean;
  status: PersistentIntelligenceStatus;
  failures: readonly PersistentIntelligenceFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  certification_hash: string;
}>;

export type PersistentIntelligenceFoundationContract = Readonly<{
  doctrine: Readonly<{
    version: "persistent-intelligence-foundation/v11.1";
    persistent_intelligence_is_memory: false;
    lifecycle: readonly PersistentIntelligenceLifecycleStage[];
    version_types: readonly PersistentIntelligenceVersionType[];
    requires_pass_before_object_creation: true;
    conditional_pass_blocks_object_creation: true;
  }>;
  result: PersistentIntelligenceFoundationResult;
  validation: PersistentIntelligenceValidation;
  observability: PersistentIntelligenceObservability;
}>;
