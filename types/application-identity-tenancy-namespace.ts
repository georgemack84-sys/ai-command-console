export type ApplicationIdentityLifecycleState = "IDENTITY_REQUESTED" | "IDENTITY_VALIDATED" | "NAMESPACE_ASSIGNED" | "OWNERSHIP_REGISTERED" | "TENANT_BOUND" | "ACTIVE" | "UPDATED" | "TRANSFERRED" | "SUSPENDED" | "RETIRED";
export type ApplicationIdentityOutcome = "PASS" | "FAIL" | "PRUNED";
export type ApplicationIdentityCheckResult = "PASS" | "FAIL";
export type AllocationStatus = "ALLOCATED" | "RESERVED" | "RETIRED";
export type IdentityStatus = "ACTIVE" | "SUSPENDED" | "RETIRED";
export type TenantQualificationStatus = "QUALIFIED" | "UNQUALIFIED";

export type ApplicationIdentityFailure =
  | "P4_3_COMPOSITION_INVALID"
  | "CCI_IDENTITY_INFRASTRUCTURE_INVALID"
  | "CCI_NAMESPACE_REGISTRY_INVALID"
  | "CAF_IDENTITY_SERVICES_INVALID"
  | "TQF_TENANT_CONTRACT_INVALID"
  | "APPLICATION_ID_MISSING"
  | "APPLICATION_ID_NOT_UNIQUE"
  | "APPLICATION_ID_MUTABLE"
  | "IDENTITY_LINEAGE_INCOMPLETE"
  | "IDENTITY_INTEGRITY_FAILED"
  | "NAMESPACE_NOT_ALLOCATED"
  | "NAMESPACE_COLLISION_DETECTED"
  | "NAMESPACE_NOT_RESERVED"
  | "NAMESPACE_INHERITANCE_INVALID"
  | "NAMESPACE_RETIREMENT_MISSING"
  | "OWNERSHIP_NOT_REGISTERED"
  | "CONSTITUTIONAL_OWNER_MISSING"
  | "OPERATIONAL_OWNER_MISSING"
  | "OWNERSHIP_TRANSFER_UNGOVERNED"
  | "OWNERSHIP_LINEAGE_INCOMPLETE"
  | "TENANT_NOT_BOUND"
  | "TENANT_ISOLATION_FAILED"
  | "TENANT_BOUNDARY_INVALID"
  | "TENANT_QUALIFICATION_UNVERIFIED"
  | "TENANT_NAMESPACE_BINDING_INVALID"
  | "TENANT_CONTRACT_VALIDATION_FAILED"
  | "IDENTITY_VALIDATION_FAILED"
  | "REGISTRY_SYNCHRONIZATION_FAILED"
  | "AUDIT_EVIDENCE_MISSING"
  | "AUDIT_EVIDENCE_MUTABLE"
  | "APPLICATION_LIFECYCLE_IMPLEMENTED"
  | "DEPLOYMENT_ATTEMPTED"
  | "RUNTIME_ATTEMPTED"
  | "MESSAGING_ATTEMPTED"
  | "GOVERNANCE_EXECUTION_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type ApplicationIdentityScenario = "BASELINE" | ApplicationIdentityFailure;
export type ApplicationIdentityInput = Readonly<{ scenario?: ApplicationIdentityScenario; tenant_id?: string }>;

export type ApplicationIdentityRecord = Readonly<{
  application_id: string;
  application_name: string;
  application_type: string;
  namespace: string;
  owner_id: string;
  constitutional_owner: string;
  tenant_contract_reference: string;
  identity_version: string;
  identity_status: IdentityStatus;
  lineage_reference: string;
  immutable: boolean;
  globally_unique: boolean;
  integrity_hash: string;
}>;

export type NamespaceRecord = Readonly<{
  namespace_id: string;
  namespace: string;
  parent_namespace: string;
  owner: string;
  child_namespaces: readonly string[];
  allocation_status: AllocationStatus;
  reservation_status: "RESERVED" | "UNRESERVED";
  allocation_history: readonly string[];
  retirement_history: readonly string[];
  lineage_reference: string;
  collision_prevention: boolean;
  integrity_hash: string;
}>;

export type ApplicationOwnershipRecord = Readonly<{
  ownership_id: string;
  application_id: string;
  owning_organization: string;
  constitutional_owner: string;
  operational_owner: string;
  ownership_type: "CONSTITUTIONAL" | "OPERATIONAL";
  stewardship_assignment: string;
  effective_date: string;
  transfer_governance_ref: string;
  lineage_reference: string;
  registered: boolean;
  integrity_hash: string;
}>;

export type TenantIntegrationRecord = Readonly<{
  tenant_binding_id: string;
  application_id: string;
  tenant_id: string;
  tenant_contract_reference: string;
  namespace_binding: string;
  boundary_validation_status: ApplicationIdentityCheckResult;
  qualification_status: TenantQualificationStatus;
  isolation_enforced: boolean;
  contract_validated: boolean;
  integrity_hash: string;
}>;

export type IdentityValidationReport = Readonly<{
  report_id: string;
  identity_uniqueness_valid: boolean;
  duplicate_detection_passed: boolean;
  namespace_verified: boolean;
  ownership_validated: boolean;
  tenant_qualification_verified: boolean;
  tenant_boundary_validated: boolean;
  result: ApplicationIdentityCheckResult;
  integrity_hash: string;
}>;

export type RegistrySynchronization = Readonly<{
  synchronization_id: string;
  cci_identity_sync: boolean;
  cci_namespace_sync: boolean;
  caf_identity_sync: boolean;
  tqf_contract_sync: boolean;
  program_1_registry_sync: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type IdentityEvidence = Readonly<{
  evidence_id: string;
  identity_refs: readonly string[];
  namespace_refs: readonly string[];
  ownership_refs: readonly string[];
  tenant_boundary_refs: readonly string[];
  validation_refs: readonly string[];
  synchronization_refs: readonly string[];
  audit_refs: readonly string[];
  lineage_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationIdentityCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationIdentityOutcome;
  phase_ready: boolean;
  identity_unique_immutable: boolean;
  namespace_governed: boolean;
  ownership_registered: boolean;
  tenant_boundaries_validated: boolean;
  tenant_contracts_integrated: boolean;
  registries_operational: boolean;
  lineage_deterministic: boolean;
  evidence_complete: boolean;
  constitutional_ownership_enforced: boolean;
  no_forbidden_scope: boolean;
  failures: readonly ApplicationIdentityFailure[];
  integrity_hash: string;
}>;

export type ApplicationIdentityTenancyNamespaceResult = Readonly<{
  phase_version: "application-identity-tenancy-namespace/v4.4";
  phase_identifier: "ApplicationIdentityTenancyNamespace";
  application_capability_composition_ref: "application-capability-composition/v4.3";
  cci_identity_infrastructure_ref: "Program 2 - CCI Identity Infrastructure";
  cci_namespace_registry_ref: "Program 2 - CCI Namespace Registry";
  caf_identity_services_ref: "Program 3 - CAF Identity Services";
  tqf_tenant_contracts_ref: "Program 1 - Tenant Qualification Framework";
  identity_lifecycle: readonly ApplicationIdentityLifecycleState[];
  identity_record: ApplicationIdentityRecord;
  namespace_record: NamespaceRecord;
  ownership_record: ApplicationOwnershipRecord;
  tenant_integration: TenantIntegrationRecord;
  validation_report: IdentityValidationReport;
  registry_synchronization: RegistrySynchronization;
  evidence: IdentityEvidence;
  certification: ApplicationIdentityCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationIdentityValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationIdentityOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  identity_valid: boolean;
  namespace_valid: boolean;
  ownership_valid: boolean;
  tenant_valid: boolean;
  validation_report_valid: boolean;
  synchronization_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationIdentityFailure[];
  integrity_hash: string;
}>;

export type ApplicationIdentityBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-identity-tenancy-namespace/v4.4";
    owns_application_identities: true;
    owns_namespaces: true;
    owns_application_ownership: true;
    owns_tenant_integration_boundaries: true;
    implements_application_lifecycle: false;
    owns_capability_composition: false;
    performs_deployment: false;
    owns_runtime: false;
    owns_messaging: false;
    executes_governance: false;
  }>;
  result: ApplicationIdentityTenancyNamespaceResult;
  validation: ApplicationIdentityValidation;
}>;
