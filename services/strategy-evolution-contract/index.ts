import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { certifyPatternIntelligence, replayPatternIntelligenceCertification } from "@/services/pattern-intelligence-certification-gate";
import type { PatternCertificationInput, PatternCertificationResult } from "@/types/pattern-intelligence-certification-gate";
import type {
  ProhibitedStrategyMutation,
  StrategyContractApiSurface,
  StrategyContractFailure,
  StrategyDomain,
  StrategyEvolutionContract,
  StrategyEvolutionContractFoundation,
  StrategyEvolutionContractInput,
  StrategyEvolutionContractResult,
  StrategyEvolutionProposalEnvelope,
  StrategyContractValidation,
} from "@/types/strategy-evolution-contract";

const STRATEGY_CONTRACT_VERSION = "strategy-evolution-contract/v1" as const;

type Scenario = NonNullable<StrategyEvolutionContractInput["scenario"]>;

export const STRATEGY_DOMAINS: readonly StrategyDomain[] = Object.freeze([
  "PRIORITIZATION",
  "RISK_HANDLING",
  "CONFIDENCE_CALIBRATION",
  "EVIDENCE_REQUIREMENTS",
  "SIMULATION_SELECTION",
  "OPERATOR_ESCALATION",
  "GOVERNANCE_ROUTING",
  "MISSION_PLANNING",
  "RECOMMENDATION_GENERATION",
  "ROLLBACK_PREPARATION",
  "DECISION_PACKAGE_PRESENTATION",
]);

export const PROHIBITED_STRATEGY_MUTATIONS: readonly ProhibitedStrategyMutation[] = Object.freeze([
  "CONSTITUTIONAL_CHANGES",
  "GOVERNANCE_POLICY_MODIFICATION",
  "AUTHORITY_EXPANSION",
  "OPERATOR_AUTHORITY_REDUCTION",
  "TENANT_ISOLATION_CHANGES",
  "REPLAY_ARCHITECTURE_CHANGES",
  "TRUTH_LEDGER_MUTATION",
  "EVIDENCE_INTEGRITY_RULES",
  "AUDIT_LOGGING_BEHAVIOR",
  "DETERMINISTIC_EXECUTION_GUARANTEES",
  "CERTIFICATION_REQUIREMENTS",
  "FAIL_SAFE_MECHANISMS",
  "SECURITY_BOUNDARIES",
  "CRYPTOGRAPHIC_VERIFICATION",
  "IMMUTABLE_HISTORY",
]);

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function certificationScenario(scenario: Scenario): PatternCertificationInput["scenario"] {
  const map: Partial<Record<Scenario, PatternCertificationInput["scenario"]>> = {
    PATTERN_CERTIFICATION_MISSING: "CONDITIONAL_GAP",
    MISSING_REPLAY: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: StrategyEvolutionContractInput, scenario: Scenario): PatternCertificationResult {
  if (input.pattern_certification) return input.pattern_certification;
  return certifyPatternIntelligence({ scenario: certificationScenario(scenario) });
}

function buildApiSurface(): StrategyContractApiSurface {
  const base: Omit<StrategyContractApiSurface, "integrity_hash"> = {
    api_id: "strategy_evolution_contract_api",
    retrieve_contract: "GET /strategy-evolution-contract/contract",
    validate_proposal: "POST /strategy-evolution-contract/validate",
    retrieve_domains: "POST /strategy-evolution-contract/domains",
    retrieve_authority_rules: "POST /strategy-evolution-contract/authority",
    retrieve_governance_rules: "POST /strategy-evolution-contract/governance",
    retrieve_simulation_requirements: "POST /strategy-evolution-contract/simulation",
    retrieve_certification_requirements: "POST /strategy-evolution-contract/certification",
    retrieve_rollback_requirements: "POST /strategy-evolution-contract/rollback",
    retrieve_replay_requirements: "POST /strategy-evolution-contract/replay",
    update_supported: false,
    delete_supported: false,
    autonomous_strategy_mutation_supported: false,
    self_approval_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildContract(certification: PatternCertificationResult, scenario: Scenario): StrategyEvolutionContract {
  const base: Omit<StrategyEvolutionContract, "integrity_hash"> = {
    contract_id: "strategy_evolution_contract",
    contract_version: STRATEGY_CONTRACT_VERSION,
    tenant_id: scenario === "CROSS_TENANT" ? `${certification.certification_record.certification_id}:foreign` : certification.dashboard_result.dashboard_view.tenant_id,
    strategy_domains: STRATEGY_DOMAINS,
    prohibited_domains: PROHIBITED_STRATEGY_MUTATIONS,
    governance_requirements: freezeArray(["governance impact assessment", "policy references", "governance evidence", "approval routing", "approval authority", "compliance validation", "governance replay"]),
    simulation_requirements: freezeArray(["historical replay", "counterfactual replay", "mission simulation", "risk simulation", "governance simulation", "operator workflow simulation", "rollback simulation", "replay verification"]),
    operator_requirements: freezeArray(["operator visibility", "review workflow", "approval authority", "approval evidence", "approval replay", "rejection recording", "override recording"]),
    certification_requirements: freezeArray(["certification scope", "validation criteria", "certification authority", "required test suites", "evidence requirements", "replay verification", "production readiness"]),
    rollback_requirements: freezeArray(["rollback strategy", "rollback trigger", "rollback authority", "rollback dependencies", "rollback validation", "rollback replay references", "rollback verification"]),
    replay_requirements: freezeArray(["originating missions", "supporting outcomes", "supporting recommendations", "supporting decisions", "supporting patterns", "governance review", "simulation execution", "approval history"]),
    advisory_only: true,
    deterministic: true,
    governance_supremacy: true,
    operator_authority: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildProposal(certification: PatternCertificationResult, scenario: Scenario): StrategyEvolutionProposalEnvelope {
  const tenant = certification.dashboard_result.dashboard_view.tenant_id;
  const domains = scenario === "UNKNOWN_DOMAIN"
    ? freezeArray(["PRIORITIZATION" as StrategyDomain])
    : scenario === "MULTI_DOMAIN_UNAPPROVED"
      ? freezeArray<StrategyDomain>(["PRIORITIZATION", "RISK_HANDLING"])
      : freezeArray<StrategyDomain>(["PRIORITIZATION"]);
  const base: Omit<StrategyEvolutionProposalEnvelope, "integrity_hash"> = {
    proposal_id: `strategy_proposal_${hash(`${tenant}:${domains.join(":")}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${tenant}:foreign` : tenant,
    mission_scope: "mission-control-strategy-evolution",
    strategy_domains: domains,
    prohibited_domain_refs: scenario === "PROHIBITED_MUTATION" ? freezeArray(["AUTHORITY_EXPANSION"]) : freezeArray([]),
    lifecycle_state: scenario === "INVALID_LIFECYCLE" ? "AVAILABLE_FOR_ADOPTION" : "DRAFT",
    governance_refs: scenario === "MISSING_GOVERNANCE" || scenario === "GOVERNANCE_BYPASS" ? freezeArray([]) : freezeArray(["governance_policy_strategy_evolution_v1"]),
    simulation_refs: scenario === "MISSING_SIMULATION" || scenario === "SIMULATION_BYPASS" ? freezeArray([]) : freezeArray(["simulation_requirement_strategy_evolution_v1"]),
    certification_refs: scenario === "MISSING_CERTIFICATION" || scenario === "CERTIFICATION_BYPASS" ? freezeArray([]) : freezeArray(["certification_requirement_strategy_evolution_v1"]),
    rollback_refs: scenario === "MISSING_ROLLBACK" ? freezeArray([]) : freezeArray(["rollback_plan_strategy_evolution_v1"]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : certification.certification_record.replay_refs,
    operator_approval_required: scenario !== "OPERATOR_APPROVAL_DISABLED",
    multi_domain_approved: scenario !== "MULTI_DOMAIN_UNAPPROVED",
    advisory_only: scenario !== "ADVISORY_DISABLED",
    mutates_strategy: scenario === "AUTONOMOUS_MUTATION",
  };
  const proposal = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...proposal, integrity_hash: hash({ tampered: proposal.proposal_id }) });
  return proposal;
}

function collectFailures(certification: PatternCertificationResult, contract: StrategyEvolutionContract, proposal: StrategyEvolutionProposalEnvelope, scenario: Scenario): readonly StrategyContractFailure[] {
  const failures: StrategyContractFailure[] = [];
  if (scenario === "PATTERN_CERTIFICATION_MISSING" || certification.certification_record.certification_state !== "PASS" || !certification.adaptive_consumption_allowed) failures.push("PATTERN_INTELLIGENCE_CERTIFICATION_REQUIRED");
  if (scenario === "UNKNOWN_DOMAIN" || proposal.strategy_domains.some((domain) => !contract.strategy_domains.includes(domain))) failures.push("UNKNOWN_STRATEGY_DOMAIN");
  if (scenario === "MULTI_DOMAIN_UNAPPROVED" || (proposal.strategy_domains.length !== 1 && !proposal.multi_domain_approved)) failures.push("MULTI_DOMAIN_NOT_APPROVED");
  if (scenario === "PROHIBITED_MUTATION" || proposal.prohibited_domain_refs.some((domain) => contract.prohibited_domains.includes(domain))) failures.push("PROHIBITED_STRATEGY_MUTATION");
  if (scenario === "MISSING_GOVERNANCE" || !proposal.governance_refs.length) failures.push("GOVERNANCE_REQUIREMENTS_MISSING");
  if (scenario === "MISSING_SIMULATION" || !proposal.simulation_refs.length) failures.push("SIMULATION_REQUIREMENT_ABSENT");
  if (scenario === "MISSING_REPLAY" || !proposal.replay_refs.length) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (scenario === "MISSING_ROLLBACK" || !proposal.rollback_refs.length) failures.push("ROLLBACK_PLAN_ABSENT");
  if (scenario === "OPERATOR_APPROVAL_DISABLED" || !proposal.operator_approval_required) failures.push("OPERATOR_APPROVAL_DISABLED");
  if (scenario === "MISSING_CERTIFICATION" || !proposal.certification_refs.length) failures.push("CERTIFICATION_REQUIREMENT_ABSENT");
  if (scenario === "ADVISORY_DISABLED" || !proposal.advisory_only) failures.push("ADVISORY_ONLY_DISABLED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(contract) !== contract.integrity_hash || hashWithoutIntegrity(proposal) !== proposal.integrity_hash) failures.push("INTEGRITY_HASH_INVALID");
  if (scenario === "CROSS_TENANT" || proposal.tenant_id !== contract.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "INVALID_LIFECYCLE" || proposal.lifecycle_state !== "DRAFT") failures.push("INVALID_LIFECYCLE_TRANSITION");
  if (scenario === "AUTONOMOUS_MUTATION" || proposal.mutates_strategy) failures.push("AUTONOMOUS_STRATEGY_MUTATION_DETECTED");
  if (scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS_DETECTED");
  if (scenario === "SIMULATION_BYPASS") failures.push("SIMULATION_BYPASS_DETECTED");
  if (scenario === "CERTIFICATION_BYPASS") failures.push("CERTIFICATION_BYPASS_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly StrategyContractFailure[]): StrategyContractValidation["state"] {
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(certification: PatternCertificationResult, contract: StrategyEvolutionContract, proposal: StrategyEvolutionProposalEnvelope, failures: readonly StrategyContractFailure[]): StrategyContractValidation {
  const base: Omit<StrategyContractValidation, "integrity_hash"> = {
    validation_id: "strategy_evolution_contract_validation",
    state: stateFor(failures),
    certified: failures.length === 0,
    failures,
    pattern_intelligence_certified: certification.certification_record.certification_state === "PASS" && certification.adaptive_consumption_allowed,
    domains_registered: !failures.includes("UNKNOWN_STRATEGY_DOMAIN") && !failures.includes("MULTI_DOMAIN_NOT_APPROVED"),
    prohibited_mutations_enforced: !failures.includes("PROHIBITED_STRATEGY_MUTATION"),
    governance_requirements_complete: !failures.includes("GOVERNANCE_REQUIREMENTS_MISSING") && !failures.includes("GOVERNANCE_BYPASS_DETECTED"),
    simulation_requirements_complete: !failures.includes("SIMULATION_REQUIREMENT_ABSENT") && !failures.includes("SIMULATION_BYPASS_DETECTED"),
    certification_requirements_complete: !failures.includes("CERTIFICATION_REQUIREMENT_ABSENT") && !failures.includes("CERTIFICATION_BYPASS_DETECTED"),
    replay_requirements_complete: !failures.includes("REPLAY_REFERENCES_INCOMPLETE"),
    rollback_requirements_complete: !failures.includes("ROLLBACK_PLAN_ABSENT"),
    operator_approval_required: !failures.includes("OPERATOR_APPROVAL_DISABLED"),
    advisory_only_enforced: !failures.includes("ADVISORY_ONLY_DISABLED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    lifecycle_valid: !failures.includes("INVALID_LIFECYCLE_TRANSITION"),
    integrity_verified: hashWithoutIntegrity(contract) === contract.integrity_hash && hashWithoutIntegrity(proposal) === proposal.integrity_hash,
    no_autonomous_strategy_mutation: !failures.includes("AUTONOMOUS_STRATEGY_MUTATION_DETECTED"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<StrategyEvolutionContractResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification_replay_hash: result.pattern_certification.replay_hash,
    contract: result.contract,
    proposal: result.proposal_envelope,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<StrategyEvolutionContractResult, "integrity_hash">): string {
  return hash({
    strategy_evolution_contract_version: result.strategy_evolution_contract_version,
    api_surface_hash: result.api_surface.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    proposal_hash: result.proposal_envelope.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
    advisory_only: result.advisory_only,
    autonomous_strategy_mutation: result.autonomous_strategy_mutation,
  });
}

export function validateStrategyEvolutionContract(input: StrategyEvolutionContractInput = {}): StrategyEvolutionContractResult {
  const scenario = input.scenario ?? "BASELINE";
  const pattern_certification = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const contract = buildContract(pattern_certification, scenario);
  const proposal_envelope = input.proposal ?? buildProposal(pattern_certification, scenario);
  const failures = collectFailures(pattern_certification, contract, proposal_envelope, scenario);
  const validation = buildValidation(pattern_certification, contract, proposal_envelope, failures);
  const base: Omit<StrategyEvolutionContractResult, "integrity_hash" | "replay_hash"> = {
    strategy_evolution_contract_version: STRATEGY_CONTRACT_VERSION,
    pattern_certification,
    api_surface,
    contract,
    proposal_envelope,
    validation,
    deterministic: true,
    replayable: true,
    explainable: true,
    advisory_only: true,
    governance_controlled: true,
    constitutionally_compliant: validation.advisory_only_enforced && validation.prohibited_mutations_enforced,
    operator_approved_required: true,
    simulation_required: true,
    certification_required: true,
    rollback_required: true,
    tenant_isolated: validation.tenant_isolated,
    autonomous_strategy_mutation: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayStrategyEvolutionContract(result: StrategyEvolutionContractResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayPatternIntelligenceCertification(result.pattern_certification);
}

export function getStrategyEvolutionContractFoundation(): StrategyEvolutionContractFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    strategy_evolution_contract_version: STRATEGY_CONTRACT_VERSION,
    api_surface,
    result: validateStrategyEvolutionContract(),
  });
}

export const StrategyEvolutionContractEngine = Object.freeze({
  validate: validateStrategyEvolutionContract,
  replay: replayStrategyEvolutionContract,
});
