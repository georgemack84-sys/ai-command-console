import type { AuthorityExplanation, AuthorityExplanationRequest, AuthorityExplanationService as AuthorityExplanationServiceContract, AuthorityLedger } from "../../types/learning-constitution";

/** Read-only explanation of why a record has its authority and epistemic context. */
export class LedgerBackedAuthorityExplanationService implements AuthorityExplanationServiceContract {
  constructor(private readonly ledger: AuthorityLedger) {}
  async explain(request: AuthorityExplanationRequest): Promise<AuthorityExplanation> {
    const events = await this.ledger.findByAuthorityId(request.authority.authorityId);
    return { authority: request.authority, confidence: request.profile.confidence, evidenceIds: request.profile.evidence.items.map((item) => item.evidenceId), provenance: request.authority.provenance, supersedes: request.authority.supersedes, events, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
