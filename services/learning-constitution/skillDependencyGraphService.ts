import type { GateDecision } from "../../types/learning-constitution/durableLearningGate";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { FailureAttributionAssessment, SkillBlastRadiusAnalysis, SkillBlastRadiusEntry, SkillBottleneckDiagnosis, SkillBottleneckHypothesis, SkillDependency, SkillDependencyValidation, SkillGraphArtifactRecord, SkillGraphArtifactStore, SkillGraphDependencyPath, SkillGraphIntegrityReport, SkillGraphIntegrityViolation, SkillGraphIntegrityViolationCode, SkillGraphProjection, SkillGraphReadinessState, SkillGraphRiskTrigger, SkillGraphTraversal, SkillGraphTraversalEntry, SkillGraphVersion, SkillPrerequisiteHealth, SkillReadiness, SkillRemediationPlan, SkillRemediationPlanActivation } from "../../types/learning-constitution/skillDependencyGraph";
import type { SkillRegistryEntry, SkillStatus } from "../../types/learning-constitution/skillRegistry";

/**
 * Structural validation only. Admission, persistence, graph version creation,
 * and audit recording remain governed by the Durable Learning Gate in later
 * Phase 19 milestones.
 */
export class SkillDependencyGraphValidator {
  validate(dependency: SkillDependency): SkillDependencyValidation {
    const reasonCodes: string[] = [];
    const prerequisiteId = dependency.prerequisite.skillId.trim();
    const dependentId = dependency.dependent.skillId.trim();

    if (!dependency.dependencyId.trim() || !prerequisiteId || !dependentId) {
      reasonCodes.push("CANONICAL_SKILL_REFERENCE_REQUIRED");
    }
    if (prerequisiteId && prerequisiteId === dependentId) {
      reasonCodes.push("SELF_DEPENDENCY_FORBIDDEN");
    }
    if (!Number.isFinite(dependency.strength) || dependency.strength < 0 || dependency.strength > 1) {
      reasonCodes.push("DEPENDENCY_STRENGTH_INVALID");
    }
    if (dependency.relationshipType === "PREREQUISITE") {
      if (dependency.requiredMasteryThreshold === null || !Number.isFinite(dependency.requiredMasteryThreshold) || dependency.requiredMasteryThreshold < 0 || dependency.requiredMasteryThreshold > 100) {
        reasonCodes.push("PREREQUISITE_THRESHOLD_INVALID");
      }
    } else if (dependency.requiredMasteryThreshold !== null) {
      reasonCodes.push("NON_PREREQUISITE_THRESHOLD_FORBIDDEN");
    }
    if (!dependency.evidenceIds.length || !dependency.evidenceIds.every((id) => id.trim())) {
      reasonCodes.push("DEPENDENCY_EVIDENCE_REQUIRED");
    }
    if (!dependency.provenance.provenanceIds.length || !dependency.provenance.provenanceIds.every((id) => id.trim()) || !dependency.provenance.assertedBy.actorId.trim() || !dependency.provenance.assertedAt.trim()) {
      reasonCodes.push("DEPENDENCY_PROVENANCE_REQUIRED");
    }
    if (!dependency.graphVersionId.trim() || !dependency.rationale.trim()) {
      reasonCodes.push("GRAPH_VERSION_AND_RATIONALE_REQUIRED");
    }

    return {
      dependencyId: dependency.dependencyId,
      valid: reasonCodes.length === 0,
      reasonCodes: reasonCodes.length ? reasonCodes : ["SKILL_DEPENDENCY_VALID"],
    };
  }
}

const integrityCodes = new Set<SkillGraphIntegrityViolationCode>([
  "CANONICAL_SKILL_REFERENCE_REQUIRED", "SELF_DEPENDENCY_FORBIDDEN", "DEPENDENCY_STRENGTH_INVALID", "PREREQUISITE_THRESHOLD_INVALID", "NON_PREREQUISITE_THRESHOLD_FORBIDDEN", "DEPENDENCY_EVIDENCE_REQUIRED", "DEPENDENCY_PROVENANCE_REQUIRED", "GRAPH_VERSION_AND_RATIONALE_REQUIRED",
]);

/**
 * Phase 19C whole-graph validation. It is intentionally deterministic and
 * side-effect free so callers can reject invalid graph mutations before the
 * Durable Learning Gate authorizes an immutable graph-version event.
 */
export class SkillGraphIntegrityService {
  constructor(private readonly edgeValidator = new SkillDependencyGraphValidator()) {}

  inspect(dependencies: readonly SkillDependency[], canonicalSkillIds: ReadonlySet<string>): SkillGraphIntegrityReport {
    const violations: SkillGraphIntegrityViolation[] = [];
    for (const dependency of dependencies) {
      for (const code of this.edgeValidator.validate(dependency).reasonCodes) {
        if (code !== "SKILL_DEPENDENCY_VALID" && integrityCodes.has(code as SkillGraphIntegrityViolationCode)) {
          violations.push({ code: code as SkillGraphIntegrityViolationCode, dependencyIds: [dependency.dependencyId], detail: `Dependency ${dependency.dependencyId} failed ${code}.` });
        }
      }
      for (const skillId of [dependency.prerequisite.skillId, dependency.dependent.skillId]) {
        if (!canonicalSkillIds.has(skillId)) {
          violations.push({ code: "CANONICAL_SKILL_MISSING", dependencyIds: [dependency.dependencyId], detail: `Dependency ${dependency.dependencyId} references unknown canonical skill ${skillId}.` });
        }
      }
    }

    const edgesByKey = new Map<string, string[]>();
    for (const dependency of dependencies) {
      const key = [dependency.prerequisite.skillId, dependency.dependent.skillId, dependency.relationshipType].join("\u0000");
      edgesByKey.set(key, [...(edgesByKey.get(key) ?? []), dependency.dependencyId]);
    }
    for (const dependencyIds of edgesByKey.values()) {
      if (dependencyIds.length > 1) violations.push({ code: "DUPLICATE_DEPENDENCY", dependencyIds, detail: "Multiple dependencies describe the same prerequisite, dependent, and relationship type." });
    }

    const prerequisiteEdges = dependencies.filter((dependency) => dependency.relationshipType === "PREREQUISITE");
    const dependentsByPrerequisite = new Map<string, readonly SkillDependency[]>();
    for (const dependency of prerequisiteEdges) {
      const edges = dependentsByPrerequisite.get(dependency.prerequisite.skillId) ?? [];
      dependentsByPrerequisite.set(dependency.prerequisite.skillId, [...edges, dependency]);
    }
    const visited = new Set<string>();
    const active = new Set<string>();
    const path: SkillDependency[] = [];
    const cycleKeys = new Set<string>();
    const visit = (skillId: string): void => {
      if (active.has(skillId)) {
        const start = path.findIndex((edge) => edge.prerequisite.skillId === skillId);
        const cycle = [...path.slice(start), path.at(-1)!];
        const dependencyIds = [...new Set(cycle.map((edge) => edge.dependencyId))];
        const key = [...dependencyIds].sort().join("|");
        if (!cycleKeys.has(key)) {
          cycleKeys.add(key);
          violations.push({ code: "HARD_PREREQUISITE_CYCLE", dependencyIds, detail: `Hard prerequisite cycle detected: ${dependencyIds.join(" -> ")}.` });
        }
        return;
      }
      if (visited.has(skillId)) return;
      visited.add(skillId);
      active.add(skillId);
      for (const edge of dependentsByPrerequisite.get(skillId) ?? []) {
        path.push(edge);
        visit(edge.dependent.skillId);
        path.pop();
      }
      active.delete(skillId);
    };
    for (const skillId of canonicalSkillIds) visit(skillId);
    return { valid: violations.length === 0, violations };
  }
}

type TraversalDirection = "UPSTREAM" | "DOWNSTREAM";

/** Read-only traversal over a validated graph. Cycles are guarded anyway so an invalid draft can never loop a caller. */
export class SkillGraphTraversalService {
  upstream(skillId: string, dependencies: readonly SkillDependency[], relationshipTypes: readonly SkillDependency["relationshipType"][] = ["PREREQUISITE"]): SkillGraphTraversal {
    return this.traverse(skillId, dependencies, "UPSTREAM", relationshipTypes);
  }

  downstream(skillId: string, dependencies: readonly SkillDependency[], relationshipTypes: readonly SkillDependency["relationshipType"][] = ["PREREQUISITE"]): SkillGraphTraversal {
    return this.traverse(skillId, dependencies, "DOWNSTREAM", relationshipTypes);
  }

  transitiveClosure(skillId: string, dependencies: readonly SkillDependency[], direction: TraversalDirection, relationshipTypes: readonly SkillDependency["relationshipType"][] = ["PREREQUISITE"]): readonly string[] {
    return this.traverse(skillId, dependencies, direction, relationshipTypes).transitive.map((entry) => entry.skillId);
  }

  private traverse(skillId: string, dependencies: readonly SkillDependency[], direction: TraversalDirection, relationshipTypes: readonly SkillDependency["relationshipType"][]): SkillGraphTraversal {
    const allowedTypes = new Set(relationshipTypes);
    const eligible = dependencies.filter((dependency) => allowedTypes.has(dependency.relationshipType));
    const adjacency = new Map<string, SkillDependency[]>();
    for (const dependency of eligible) {
      const key = direction === "UPSTREAM" ? dependency.dependent.skillId : dependency.prerequisite.skillId;
      adjacency.set(key, [...(adjacency.get(key) ?? []), dependency]);
    }
    const direct = (adjacency.get(skillId) ?? []).map((dependency) => ({
      skillId: direction === "UPSTREAM" ? dependency.prerequisite.skillId : dependency.dependent.skillId,
      depth: 1,
      viaDependencyIds: [dependency.dependencyId],
    }));
    const entries = new Map<string, SkillGraphTraversalEntry>();
    const paths: SkillGraphDependencyPath[] = [];
    const visit = (currentSkillId: string, skillPath: readonly string[], dependencyPath: readonly string[], visited: ReadonlySet<string>): void => {
      for (const dependency of adjacency.get(currentSkillId) ?? []) {
        const nextSkillId = direction === "UPSTREAM" ? dependency.prerequisite.skillId : dependency.dependent.skillId;
        if (visited.has(nextSkillId)) continue;
        const nextSkillPath = [...skillPath, nextSkillId];
        const nextDependencyPath = [...dependencyPath, dependency.dependencyId];
        const depth = nextDependencyPath.length;
        const prior = entries.get(nextSkillId);
        if (!prior || depth < prior.depth) entries.set(nextSkillId, { skillId: nextSkillId, depth, viaDependencyIds: nextDependencyPath });
        if (!(adjacency.get(nextSkillId)?.length)) paths.push({ skillIds: nextSkillPath, dependencyIds: nextDependencyPath });
        visit(nextSkillId, nextSkillPath, nextDependencyPath, new Set([...visited, nextSkillId]));
      }
    };
    visit(skillId, [skillId], [], new Set([skillId]));
    const transitive = [...entries.values()].sort((left, right) => left.depth - right.depth || left.skillId.localeCompare(right.skillId));
    return { direct, transitive, paths };
  }
}

const demonstratedStatuses = new Set<SkillStatus>(["DEMONSTRATED", "VALIDATED", "MASTERED"]);

/**
 * Calculates graph readiness from current registry projections. This is a
 * read-only decision aid: canonical Phase 18 mastery and status remain intact.
 */
export class SkillReadinessService {
  assess(input: Readonly<{
    skillId: string;
    dependencies: readonly SkillDependency[];
    registryEntries: ReadonlyMap<string, SkillRegistryEntry>;
    remediationActive?: boolean;
    revalidationRecommended?: boolean;
  }>): SkillReadiness {
    const target = input.registryEntries.get(input.skillId) ?? null;
    const upstream = new SkillGraphTraversalService().upstream(input.skillId, input.dependencies);
    const reachableUpstreamSkills = new Set([input.skillId, ...upstream.transitive.map((entry) => entry.skillId)]);
    const prerequisites = input.dependencies.filter((dependency) => dependency.relationshipType === "PREREQUISITE" && reachableUpstreamSkills.has(dependency.dependent.skillId) && reachableUpstreamSkills.has(dependency.prerequisite.skillId));
    const prerequisiteHealth = prerequisites.map((dependency): SkillPrerequisiteHealth => {
      const entry = input.registryEntries.get(dependency.prerequisite.skillId);
      const observedMastery = entry ? entry.assessment.estimatedMastery ?? entry.skill.mastery : null;
      const threshold = dependency.requiredMasteryThreshold!;
      const satisfied = observedMastery !== null && observedMastery >= threshold && !["SUSPENDED", "RETIRED"].includes(entry?.status ?? "");
      return {
        dependencyId: dependency.dependencyId,
        skillId: dependency.prerequisite.skillId,
        requiredMasteryThreshold: threshold,
        observedMastery,
        satisfied,
        reason: !entry ? "Canonical prerequisite record is unavailable." : entry.status === "SUSPENDED" || entry.status === "RETIRED" ? `Prerequisite is ${entry.status}.` : observedMastery === null ? "Prerequisite has no estimated mastery." : satisfied ? "Prerequisite threshold satisfied." : `Prerequisite mastery ${observedMastery} is below threshold ${threshold}.`,
      };
    });
    const blocked = prerequisiteHealth.some((health) => !health.satisfied) || !target || ["SUSPENDED", "RETIRED"].includes(target?.status ?? "");
    const canonicalStatus = target?.status ?? null;
    let state: SkillGraphReadinessState;
    let reason: string;
    if (!target) {
      state = "LOCKED";
      reason = "Canonical target skill record is unavailable.";
    } else if (input.remediationActive) {
      state = "REMEDIATING";
      reason = "An active remediation plan is associated with this skill.";
    } else if (input.revalidationRecommended || canonicalStatus === "STALE") {
      state = "REVALIDATION_REQUIRED";
      reason = input.revalidationRecommended ? "Current evidence or graph risk recommends reevaluation." : "Canonical status is stale.";
    } else if (canonicalStatus === "DEGRADED" || (blocked && demonstratedStatuses.has(target.status))) {
      state = "DEGRADED";
      reason = canonicalStatus === "DEGRADED" ? "Canonical status is degraded." : "A previously demonstrated capability has an unsatisfied critical prerequisite.";
    } else if (blocked) {
      state = "LOCKED";
      reason = canonicalStatus === "SUSPENDED" || canonicalStatus === "RETIRED" ? `Canonical status is ${canonicalStatus}.` : "One or more critical prerequisites are unsatisfied.";
    } else if (canonicalStatus === "MASTERED") {
      state = "MASTERED";
      reason = "Prerequisites are satisfied and canonical status is mastered.";
    } else if (canonicalStatus === "PROVISIONAL") {
      state = "PROVISIONAL";
      reason = "Prerequisites are satisfied and canonical status is provisional.";
    } else {
      state = "READY";
      reason = "Prerequisites are satisfied; the graph makes no further capability claim.";
    }
    return { skillId: input.skillId, state, blocked, canonicalStatus, prerequisiteHealth, reason };
  }
}

const alternativeAttributions = (): readonly FailureAttributionAssessment[] => [
  { attribution: "TARGET_SKILL_DEFICIENCY", status: "UNRESOLVED", reason: "Target-skill evidence requires separate analysis." },
  { attribution: "PROCEDURE_FAILURE", status: "UNRESOLVED", reason: "Procedure execution evidence was not evaluated by the graph." },
  { attribution: "KNOWLEDGE_GAP", status: "UNRESOLVED", reason: "Knowledge coverage was not evaluated by the graph." },
  { attribution: "MISCLASSIFIED_TASK", status: "UNRESOLVED", reason: "Task classification was not evaluated by the graph." },
  { attribution: "BAD_REQUIREMENTS", status: "UNRESOLVED", reason: "Requirement quality was not evaluated by the graph." },
  { attribution: "INSUFFICIENT_CONTEXT", status: "UNRESOLVED", reason: "Context sufficiency was not evaluated by the graph." },
  { attribution: "EXECUTION_ERROR", status: "UNRESOLVED", reason: "Execution telemetry was not evaluated by the graph." },
  { attribution: "EVALUATION_ERROR", status: "UNRESOLVED", reason: "Evaluation validity was not evaluated by the graph." },
  { attribution: "UNKNOWN", status: "UNRESOLVED", reason: "The graph alone cannot fully attribute an evaluation failure." },
];

/** Identifies weak, evidenced prerequisites as hypotheses; it never attributes a failure conclusively from topology alone. */
export class SkillBottleneckDetectionService {
  diagnose(input: Readonly<{
    targetSkillId: string;
    dependencies: readonly SkillDependency[];
    registryEntries: ReadonlyMap<string, SkillRegistryEntry>;
    failedEvaluationEvidenceIds: readonly string[];
  }>): SkillBottleneckDiagnosis {
    const alternatives = alternativeAttributions();
    if (!input.failedEvaluationEvidenceIds.length || !input.failedEvaluationEvidenceIds.every((id) => id.trim())) {
      return { status: "INSUFFICIENT_EVIDENCE", targetSkillId: input.targetSkillId, hypotheses: [], attributionAssessments: [{ attribution: "PREREQUISITE_DEFICIENCY", status: "UNRESOLVED", reason: "A failed evaluation must provide evidence identifiers." }, ...alternatives], reason: "Failure attribution requires stored evaluation evidence." };
    }
    const upstream = new SkillGraphTraversalService().upstream(input.targetSkillId, input.dependencies);
    const reachable = new Set([input.targetSkillId, ...upstream.transitive.map((entry) => entry.skillId)]);
    const dependencyById = new Map(input.dependencies.map((dependency) => [dependency.dependencyId, dependency]));
    const pathsBySkill = new Map(upstream.transitive.map((entry) => [entry.skillId, [input.targetSkillId, ...entry.viaDependencyIds.map((id) => dependencyById.get(id)!.prerequisite.skillId)]]));
    const hypotheses: SkillBottleneckHypothesis[] = input.dependencies
      .filter((dependency) => dependency.relationshipType === "PREREQUISITE" && reachable.has(dependency.dependent.skillId) && reachable.has(dependency.prerequisite.skillId))
      .flatMap((dependency) => {
        const entry = input.registryEntries.get(dependency.prerequisite.skillId);
        const observedMastery = entry?.assessment.estimatedMastery ?? entry?.skill.mastery ?? null;
        const threshold = dependency.requiredMasteryThreshold!;
        if (observedMastery === null || observedMastery >= threshold) return [];
        const deficit = threshold - observedMastery;
        const evidenceIds = [...new Set([...input.failedEvaluationEvidenceIds, ...dependency.evidenceIds, ...(entry?.skill.evidence.map((evidence) => evidence.evidenceId) ?? [])])];
        const graphPath = pathsBySkill.get(dependency.prerequisite.skillId) ?? [input.targetSkillId, dependency.dependencyId, dependency.prerequisite.skillId];
        return [{ targetSkillId: input.targetSkillId, prerequisiteSkillId: dependency.prerequisite.skillId, dependencyId: dependency.dependencyId, deficit, score: Number(((deficit / threshold) * dependency.strength).toFixed(4)), graphPath, evidenceIds, attribution: "PREREQUISITE_DEFICIENCY" as const, confidence: evidenceIds.length >= 3 ? "MEDIUM" as const : "LOW" as const, reason: `${dependency.prerequisite.skillId} mastery ${observedMastery} is below its required threshold ${threshold}.` }];
      })
      .sort((left, right) => right.score - left.score || right.deficit - left.deficit || left.prerequisiteSkillId.localeCompare(right.prerequisiteSkillId));
    const prerequisiteAssessment: FailureAttributionAssessment = hypotheses.length
      ? { attribution: "PREREQUISITE_DEFICIENCY", status: "SUPPORTED", reason: `${hypotheses.length} weak evidenced prerequisite hypothesis${hypotheses.length === 1 ? "" : "es"} found.` }
      : { attribution: "PREREQUISITE_DEFICIENCY", status: "NOT_SUPPORTED", reason: "No reachable prerequisite is below its validated threshold." };
    return hypotheses.length
      ? { status: "RECOMMENDATION", targetSkillId: input.targetSkillId, hypotheses, attributionAssessments: [prerequisiteAssessment, ...alternatives], reason: "A prerequisite deficiency is a supported remediation hypothesis; other failure causes remain unresolved." }
      : { status: "NOT_LOCALIZED", targetSkillId: input.targetSkillId, hypotheses: [], attributionAssessments: [prerequisiteAssessment, ...alternatives], reason: "The graph did not localize a weak prerequisite capable of explaining the failure." };
  }
}

/** Produces the narrowest graph-supported remediation sequence for a diagnosis. */
export class SkillRemediationPlanBuilder {
  build(input: Readonly<{
    planId: string;
    diagnosis: SkillBottleneckDiagnosis;
    graphVersionId: string;
    procedureIds?: readonly string[];
    exampleIds?: readonly string[];
    createdBy: import("../../types/learning-constitution/provenance").ProvenanceActor;
    createdAt: string;
  }>): SkillRemediationPlan {
    if (input.diagnosis.status !== "RECOMMENDATION" || !input.diagnosis.hypotheses.length) throw new Error("remediation plan requires a supported bottleneck hypothesis");
    if (!input.planId.trim() || !input.graphVersionId.trim() || !input.createdBy.actorId.trim() || !input.createdAt.trim()) throw new Error("remediation plan identity and provenance are required");
    const hypothesis = input.diagnosis.hypotheses[0]!;
    const procedureIds = input.procedureIds ?? [];
    const exampleIds = input.exampleIds ?? [];
    return {
      planId: input.planId,
      targetSkillId: hypothesis.targetSkillId,
      bottleneckSkillId: hypothesis.prerequisiteSkillId,
      basedOnDependencyId: hypothesis.dependencyId,
      diagnosisEvidenceIds: hypothesis.evidenceIds,
      graphPath: hypothesis.graphPath,
      graphVersionId: input.graphVersionId,
      status: "PROPOSED",
      steps: [
        { stepId: `${input.planId}:practice`, action: "PRACTICE", skillId: hypothesis.prerequisiteSkillId, procedureIds, exampleIds, evidenceIds: hypothesis.evidenceIds, successCriterion: `Practice the diagnosed bottleneck with evidence linked to ${hypothesis.dependencyId}.` },
        { stepId: `${input.planId}:evaluate-prerequisite`, action: "PREREQUISITE_EVALUATION", skillId: hypothesis.prerequisiteSkillId, procedureIds: [], exampleIds: [], evidenceIds: hypothesis.evidenceIds, successCriterion: `Evaluate ${hypothesis.prerequisiteSkillId} at its validated prerequisite threshold.` },
        { stepId: `${input.planId}:retest-target`, action: "RETEST_TARGET", skillId: hypothesis.targetSkillId, procedureIds: [], exampleIds: [], evidenceIds: hypothesis.evidenceIds, successCriterion: `Retest ${hypothesis.targetSkillId}; no mastery value is changed by this plan.` },
      ],
      createdBy: input.createdBy,
      createdAt: input.createdAt,
      executionPermissionGranted: false,
    };
  }
}

/** Stores the remediation lifecycle as immutable facts; callers derive status from those facts. */
export class SkillRemediationPlanService {
  constructor(private readonly artifacts: SkillGraphArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async create(plan: SkillRemediationPlan, workspaceId: string, correlationId: string): Promise<SkillRemediationPlan> {
    await this.artifacts.append({ artifactId: `SKILL_REMEDIATION_PLAN:${plan.planId}`, artifactType: "REMEDIATION_PLAN_CREATED", subjectId: plan.planId, payload: plan, createdAt: plan.createdAt });
    if (this.audit) await this.audit.append({ eventId: `audit:skill-remediation-plan:${plan.planId}`, eventType: "SKILL_REMEDIATION_PLAN_CREATED", workspaceId, occurredAt: plan.createdAt, actor: plan.createdBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: plan.diagnosisEvidenceIds }, payload: { planId: plan.planId, targetSkillId: plan.targetSkillId, bottleneckSkillId: plan.bottleneckSkillId, executionPermissionGranted: false } });
    return plan;
  }
  async activate(activation: SkillRemediationPlanActivation, workspaceId: string, correlationId: string): Promise<SkillRemediationPlanActivation> {
    if (!activation.planId.trim() || !activation.actor.actorId.trim() || !activation.activatedAt.trim()) throw new Error("remediation activation requires identity and provenance");
    await this.artifacts.append({ artifactId: `SKILL_REMEDIATION_ACTIVATED:${activation.planId}`, artifactType: "REMEDIATION_PLAN_ACTIVATED", subjectId: activation.planId, payload: activation, createdAt: activation.activatedAt });
    if (this.audit) await this.audit.append({ eventId: `audit:skill-remediation-activated:${activation.planId}`, eventType: "SKILL_REMEDIATION_ACTIVATED", workspaceId, occurredAt: activation.activatedAt, actor: activation.actor, correlationId, schemaVersion: "10.0", references: {}, payload: { planId: activation.planId, executionPermissionGranted: false } });
    return activation;
  }
}

/** Identifies reevaluation risk downstream of a weak or stale prerequisite without invalidating any capability claim. */
export class SkillBlastRadiusAnalysisService {
  analyze(input: Readonly<{
    sourceSkillId: string;
    trigger: SkillGraphRiskTrigger;
    dependencies: readonly SkillDependency[];
    registryEntries: ReadonlyMap<string, SkillRegistryEntry>;
  }>): SkillBlastRadiusAnalysis {
    const source = input.registryEntries.get(input.sourceSkillId);
    if (!source && input.trigger === "WEAKENED") {
      return { sourceSkillId: input.sourceSkillId, trigger: input.trigger, status: "INSUFFICIENT_EVIDENCE", directlyAffected: [], potentiallyAffected: [], historicalMasteryChanged: false, reason: "A weakened-skill analysis requires a canonical source skill projection." };
    }
    const sourceMastery = source?.assessment.estimatedMastery ?? source?.skill.mastery ?? null;
    const directEdges = input.dependencies.filter((dependency) => dependency.relationshipType === "PREREQUISITE" && dependency.prerequisite.skillId === input.sourceSkillId);
    const affectedDirectEdges = directEdges.filter((dependency) => input.trigger !== "WEAKENED" || sourceMastery === null || sourceMastery < dependency.requiredMasteryThreshold!);
    if (!affectedDirectEdges.length) {
      return { sourceSkillId: input.sourceSkillId, trigger: input.trigger, status: "NO_IMPACT", directlyAffected: [], potentiallyAffected: [], historicalMasteryChanged: false, reason: "No direct prerequisite threshold is currently affected by the trigger." };
    }
    const downstream = new SkillGraphTraversalService().downstream(input.sourceSkillId, input.dependencies);
    const edgeById = new Map(input.dependencies.map((dependency) => [dependency.dependencyId, dependency]));
    const directIds = new Set(affectedDirectEdges.map((dependency) => dependency.dependencyId));
    const severity = input.trigger === "WEAKENED" && sourceMastery !== null
      ? Math.max(...affectedDirectEdges.map((dependency) => Math.min(1, (dependency.requiredMasteryThreshold! - sourceMastery) / dependency.requiredMasteryThreshold!)))
      : 0.5;
    const toEntry = (entry: SkillGraphTraversalEntry): SkillBlastRadiusEntry => {
      const strength = entry.viaDependencyIds.reduce((product, id) => product * (edgeById.get(id)?.strength ?? 0), 1);
      const priority = Number((severity * strength / entry.depth).toFixed(4));
      return { skillId: entry.skillId, depth: entry.depth, dependencyIds: entry.viaDependencyIds, reevaluationPriority: priority, revalidationRecommended: true, reason: entry.depth === 1 ? `Direct prerequisite dependency is affected by ${input.sourceSkillId}.` : `Potential impact propagates from ${input.sourceSkillId} through ${entry.depth} prerequisite levels.` };
    };
    const directlyAffected = downstream.direct.filter((entry) => directIds.has(entry.viaDependencyIds[0]!)).map(toEntry).sort((left, right) => right.reevaluationPriority - left.reevaluationPriority);
    const potentiallyAffected = downstream.transitive.filter((entry) => entry.depth > 1 && directIds.has(entry.viaDependencyIds[0]!)).map(toEntry).sort((left, right) => right.reevaluationPriority - left.reevaluationPriority);
    return { sourceSkillId: input.sourceSkillId, trigger: input.trigger, status: "POTENTIAL_IMPACT", directlyAffected, potentiallyAffected, historicalMasteryChanged: false, reason: "Affected skills are prioritized for reevaluation; their canonical mastery remains unchanged." };
  }
}

const isArtifact = <T>(artifact: SkillGraphArtifactRecord, artifactType: SkillGraphArtifactRecord["artifactType"]): artifact is SkillGraphArtifactRecord & { payload: T } => artifact.artifactType === artifactType;

/** Rebuilds the active graph from immutable admission and version events. */
export class SkillGraphProjectionService {
  constructor(private readonly artifacts: SkillGraphArtifactStore) {}

  async get(): Promise<SkillGraphProjection> {
    const artifacts = await this.artifacts.listWorkspaceArtifacts();
    const admitted = artifacts.filter((artifact) => isArtifact<SkillDependency>(artifact, "DEPENDENCY_ADMITTED")).map((artifact) => artifact.payload);
    const versions = artifacts.filter((artifact) => isArtifact<SkillGraphVersion>(artifact, "GRAPH_VERSION")).map((artifact) => artifact.payload);
    const latestVersion = versions.at(-1) ?? null;
    if (!latestVersion) return { dependencies: [], latestVersion: null };
    const admittedById = new Map(admitted.map((dependency) => [dependency.dependencyId, dependency]));
    return { dependencies: latestVersion.dependencyIds.map((id) => admittedById.get(id)).filter((dependency): dependency is SkillDependency => Boolean(dependency)), latestVersion };
  }
}

export type SkillDependencyAdmissionRequest = Readonly<{
  dependency: SkillDependency;
  gateDecision: GateDecision;
  workspaceId: string;
  correlationId: string;
  changeReason: string;
}>;

export type SkillDependencyAdmissionResult = Readonly<{
  outcome: "ACCEPT" | "DEFER" | "REJECT";
  dependencyValidation: SkillDependencyValidation;
  graphVersion?: SkillGraphVersion;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

/**
 * The graph is a governed capability map: an edge cannot become active merely
 * because it was proposed or structurally valid. It must carry the accepted
 * Phase 9 authorization for its exact candidate id.
 */
export class SkillDependencyAdmissionService {
  constructor(
    private readonly artifacts: SkillGraphArtifactStore,
    private readonly validator = new SkillDependencyGraphValidator(),
    private readonly audit?: LearningAuditLedger,
  ) {}

  async admit(request: SkillDependencyAdmissionRequest): Promise<SkillDependencyAdmissionResult> {
    const { dependency } = request;
    const validation = this.validator.validate(dependency);
    await this.artifacts.append({ artifactId: `SKILL_DEPENDENCY_CANDIDATE:${dependency.dependencyId}`, artifactType: "DEPENDENCY_CANDIDATE", subjectId: dependency.dependencyId, payload: dependency, createdAt: dependency.provenance.assertedAt });

    if (!validation.valid) return { outcome: "REJECT", dependencyValidation: validation, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    if (request.gateDecision.outcome !== "ACCEPT" || request.gateDecision.candidateId !== dependency.dependencyId) {
      return { outcome: request.gateDecision.outcome === "REJECT" ? "REJECT" : "DEFER", dependencyValidation: validation, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    }

    const projection = await new SkillGraphProjectionService(this.artifacts).get();
    if (projection.dependencies.some((item) => item.prerequisite.skillId === dependency.prerequisite.skillId && item.dependent.skillId === dependency.dependent.skillId && item.relationshipType === dependency.relationshipType)) {
      throw new Error("active skill dependency already exists");
    }
    const version: SkillGraphVersion = {
      graphVersionId: dependency.graphVersionId,
      previousGraphVersionId: projection.latestVersion?.graphVersionId ?? null,
      dependencyIds: [...projection.dependencies.map((item) => item.dependencyId), dependency.dependencyId],
      changeReason: request.changeReason,
      validationStatus: "PASSED",
      createdBy: dependency.provenance.assertedBy,
      createdAt: dependency.provenance.assertedAt,
    };
    await this.artifacts.append({ artifactId: `SKILL_DEPENDENCY_ADMITTED:${dependency.dependencyId}`, artifactType: "DEPENDENCY_ADMITTED", subjectId: dependency.dependencyId, payload: { ...dependency, lifecycle: "ACTIVE" }, createdAt: dependency.provenance.assertedAt });
    await this.artifacts.append({ artifactId: `SKILL_GRAPH_VERSION:${version.graphVersionId}`, artifactType: "GRAPH_VERSION", subjectId: version.graphVersionId, payload: version, createdAt: version.createdAt });
    if (this.audit) {
      await this.audit.append({ eventId: `audit:skill-dependency-admitted:${dependency.dependencyId}`, eventType: "SKILL_DEPENDENCY_ACCEPTED", workspaceId: request.workspaceId, occurredAt: dependency.provenance.assertedAt, actor: dependency.provenance.assertedBy, correlationId: request.correlationId, schemaVersion: "10.0", references: { provenanceIds: dependency.provenance.provenanceIds, gateEvaluationId: request.gateDecision.evaluationId }, payload: { dependencyId: dependency.dependencyId, graphVersionId: version.graphVersionId, executionPermissionGranted: false } });
      await this.audit.append({ eventId: `audit:skill-graph-version:${version.graphVersionId}`, eventType: "SKILL_GRAPH_VERSION_CREATED", workspaceId: request.workspaceId, occurredAt: version.createdAt, actor: version.createdBy, correlationId: request.correlationId, schemaVersion: "10.0", references: { provenanceIds: dependency.provenance.provenanceIds, gateEvaluationId: request.gateDecision.evaluationId }, payload: { graphVersionId: version.graphVersionId, previousGraphVersionId: version.previousGraphVersionId, dependencyIds: version.dependencyIds, executionPermissionGranted: false } });
    }
    return { outcome: "ACCEPT", dependencyValidation: validation, graphVersion: version, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}

/** Creates an evidence-backed candidate only; discovery does not alter the active graph. */
export class SkillDependencyCandidateDiscoveryService {
  constructor(private readonly artifacts: SkillGraphArtifactStore, private readonly validator = new SkillDependencyGraphValidator()) {}
  async record(discovery: import("../../types/learning-constitution/skillDependencyGraph").SkillDependencyCandidateDiscovery): Promise<SkillDependency> {
    const candidate = { ...discovery.candidate, lifecycle: "CANDIDATE" as const, evidenceIds: [...new Set([...discovery.candidate.evidenceIds, ...discovery.supportingEvidenceIds])] };
    const validation = this.validator.validate(candidate);
    if (!validation.valid) throw new Error(`invalid skill dependency candidate: ${validation.reasonCodes.join(", ")}`);
    await this.artifacts.append({ artifactId: `SKILL_DEPENDENCY_CANDIDATE:${candidate.dependencyId}`, artifactType: "DEPENDENCY_CANDIDATE", subjectId: candidate.dependencyId, payload: candidate, createdAt: candidate.provenance.assertedAt });
    return candidate;
  }
}

/** Human-reviewed evolution creates a fresh version and never rewrites prior graph history. */
export class SkillGraphEvolutionService {
  constructor(private readonly artifacts: SkillGraphArtifactStore, private readonly audit?: LearningAuditLedger) {}
  private human(review: import("../../types/learning-constitution/skillDependencyGraph").SkillDependencyHumanReview): void {
    if (review.actor.actorType !== "HUMAN" || !review.actor.actorId.trim() || !review.reason.trim()) throw new Error("skill graph evolution requires a human review with reason");
  }
  async reject(review: import("../../types/learning-constitution/skillDependencyGraph").SkillDependencyHumanReview, workspaceId: string, correlationId: string): Promise<void> {
    this.human(review);
    if (review.decision !== "REJECT") throw new Error("reject requires a REJECT review");
    await this.artifacts.append({ artifactId: `SKILL_DEPENDENCY_REJECTED:${review.reviewId}`, artifactType: "DEPENDENCY_REJECTED", subjectId: review.dependencyId, payload: review, createdAt: review.reviewedAt });
    if (this.audit) await this.audit.append({ eventId: `audit:skill-dependency-rejected:${review.reviewId}`, eventType: "SKILL_DEPENDENCY_REVIEWED", workspaceId, occurredAt: review.reviewedAt, actor: review.actor, correlationId, schemaVersion: "10.0", references: {}, payload: { dependencyId: review.dependencyId, decision: review.decision, executionPermissionGranted: false } });
  }
  async supersede(input: Readonly<{
    review: import("../../types/learning-constitution/skillDependencyGraph").SkillDependencyHumanReview;
    supersessionId: string;
    replacement: SkillDependency;
    gateDecision: GateDecision;
    workspaceId: string;
    correlationId: string;
  }>): Promise<SkillGraphVersion> {
    this.human(input.review);
    if (input.review.decision !== "SUPERSEDE") throw new Error("supersession requires a SUPERSEDE review");
    if (input.gateDecision.outcome !== "ACCEPT" || input.gateDecision.candidateId !== input.replacement.dependencyId) throw new Error("replacement dependency requires matching accepted gate decision");
    const projection = await new SkillGraphProjectionService(this.artifacts).get();
    if (!projection.dependencies.some((dependency) => dependency.dependencyId === input.review.dependencyId)) throw new Error("only an active dependency can be superseded");
    const validation = new SkillDependencyGraphValidator().validate(input.replacement);
    if (!validation.valid) throw new Error(`invalid replacement dependency: ${validation.reasonCodes.join(", ")}`);
    const replacement = { ...input.replacement, lifecycle: "ACTIVE" as const };
    const version: SkillGraphVersion = { graphVersionId: replacement.graphVersionId, previousGraphVersionId: projection.latestVersion?.graphVersionId ?? null, dependencyIds: [...projection.dependencies.filter((dependency) => dependency.dependencyId !== input.review.dependencyId).map((dependency) => dependency.dependencyId), replacement.dependencyId], changeReason: input.review.reason, validationStatus: "PASSED", createdBy: input.review.actor, createdAt: input.review.reviewedAt };
    const supersession = { supersessionId: input.supersessionId, supersededDependencyId: input.review.dependencyId, replacementDependencyId: replacement.dependencyId, reviewId: input.review.reviewId, graphVersionId: version.graphVersionId, createdAt: input.review.reviewedAt };
    await this.artifacts.append({ artifactId: `SKILL_DEPENDENCY_CANDIDATE:${replacement.dependencyId}`, artifactType: "DEPENDENCY_CANDIDATE", subjectId: replacement.dependencyId, payload: replacement, createdAt: replacement.provenance.assertedAt });
    await this.artifacts.append({ artifactId: `SKILL_DEPENDENCY_ADMITTED:${replacement.dependencyId}`, artifactType: "DEPENDENCY_ADMITTED", subjectId: replacement.dependencyId, payload: replacement, createdAt: input.review.reviewedAt });
    await this.artifacts.append({ artifactId: `SKILL_DEPENDENCY_SUPERSEDED:${supersession.supersessionId}`, artifactType: "DEPENDENCY_SUPERSEDED", subjectId: input.review.dependencyId, payload: supersession, createdAt: supersession.createdAt });
    await this.artifacts.append({ artifactId: `SKILL_GRAPH_VERSION:${version.graphVersionId}`, artifactType: "GRAPH_VERSION", subjectId: version.graphVersionId, payload: version, createdAt: version.createdAt });
    if (this.audit) {
      await this.audit.append({ eventId: `audit:skill-dependency-superseded:${supersession.supersessionId}`, eventType: "SKILL_DEPENDENCY_SUPERSEDED", workspaceId: input.workspaceId, occurredAt: supersession.createdAt, actor: input.review.actor, correlationId: input.correlationId, schemaVersion: "10.0", references: { gateEvaluationId: input.gateDecision.evaluationId, provenanceIds: replacement.provenance.provenanceIds }, payload: { ...supersession, executionPermissionGranted: false } });
      await this.audit.append({ eventId: `audit:skill-graph-version:${version.graphVersionId}`, eventType: "SKILL_GRAPH_VERSION_CREATED", workspaceId: input.workspaceId, occurredAt: version.createdAt, actor: version.createdBy, correlationId: input.correlationId, schemaVersion: "10.0", references: { gateEvaluationId: input.gateDecision.evaluationId }, payload: { graphVersionId: version.graphVersionId, previousGraphVersionId: version.previousGraphVersionId, dependencyIds: version.dependencyIds, executionPermissionGranted: false } });
    }
    return version;
  }
}

/** Read-only inspection facade used by the Phase 19 UI and API. */
export class SkillGraphInspectionService {
  inspect(input: Readonly<{
    targetSkillId?: string;
    projection: SkillGraphProjection;
    registryEntries: ReadonlyMap<string, SkillRegistryEntry>;
    artifacts: readonly SkillGraphArtifactRecord[];
  }>): import("../../types/learning-constitution/skillDependencyGraph").SkillGraphInspectionView {
    const targetSkillId = input.targetSkillId ?? input.projection.dependencies[0]?.dependent.skillId ?? null;
    const versions = input.artifacts.filter((artifact) => artifact.artifactType === "GRAPH_VERSION").map((artifact) => artifact.payload as SkillGraphVersion);
    const remediationPlans = input.artifacts.filter((artifact) => artifact.artifactType === "REMEDIATION_PLAN_CREATED").map((artifact) => artifact.payload as SkillRemediationPlan);
    if (!targetSkillId) return { targetSkillId: null, readiness: null, upstream: null, downstream: null, remediationPlans, versions };
    const traversal = new SkillGraphTraversalService();
    return {
      targetSkillId,
      readiness: new SkillReadinessService().assess({ skillId: targetSkillId, dependencies: input.projection.dependencies, registryEntries: input.registryEntries }),
      upstream: traversal.upstream(targetSkillId, input.projection.dependencies),
      downstream: traversal.downstream(targetSkillId, input.projection.dependencies),
      remediationPlans: remediationPlans.filter((plan) => plan.targetSkillId === targetSkillId || plan.bottleneckSkillId === targetSkillId),
      versions,
    };
  }
}
