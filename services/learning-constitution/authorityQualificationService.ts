import type { AuthorityQualificationRequest, AuthorityQualificationResult, AuthorityQualificationService as AuthorityQualificationServiceContract } from "../../types/learning-constitution";
import { ScopeBoundAuthorityBoundaryEvaluator } from "./authorityBoundary";
import { evaluateAuthorityConfidenceEvidence } from "./authorityConfidenceEvidence";
import { ConservativeAuthorityConflictDetector } from "./authorityConflictDetector";
import { FailClosedAuthorityGate } from "./authorityGate";
import { ScopeAwareAuthorityPrecedenceEvaluator } from "./authorityPrecedence";
import { ConservativeAuthorityResolver } from "./authorityResolver";

/** Composes Phase 6 controls into one explainable, non-mutating qualification result. */
export class DefaultAuthorityQualificationService implements AuthorityQualificationServiceContract {
  private readonly resolver = new ConservativeAuthorityResolver();
  private readonly boundaryEvaluator = new ScopeBoundAuthorityBoundaryEvaluator();
  private readonly precedenceEvaluator = new ScopeAwareAuthorityPrecedenceEvaluator();
  private readonly conflictDetector = new ConservativeAuthorityConflictDetector();
  private readonly gate = new FailClosedAuthorityGate();

  qualify(request: AuthorityQualificationRequest): AuthorityQualificationResult {
    const resolution = this.resolver.resolve(request.resolutionRequest);
    const boundary = this.boundaryEvaluator.evaluate({ authority: request.incomingAuthority, subjectScope: request.subjectScope });
    const precedence = this.precedenceEvaluator.evaluate({ existing: request.existingAuthority, incoming: request.incomingAuthority, relationshipIntent: request.relationshipIntent });
    const conflict = this.conflictDetector.detect({ existingAuthority: request.existingAuthority, incomingAuthority: request.incomingAuthority, knowledgeConflict: request.knowledgeConflict, precedence });
    const profile = evaluateAuthorityConfidenceEvidence(request.profile);
    const gate = this.gate.evaluate({ resolution, authorityRecord: request.incomingAuthority, boundary, conflict, delegationValid: request.delegationValid });
    const status = gate.decision === "ALLOW" ? "QUALIFIED" : gate.decision === "REVIEW" ? "REVIEW_REQUIRED" : "REJECTED";
    return { status, resolution, boundary, precedence, conflict, profile, gate, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
