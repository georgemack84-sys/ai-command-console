import { CONFIDENCE_BLOCKED_SEMANTICS } from "./contracts/confidenceContracts";
import type {
  DeterministicConfidenceError,
  DeterministicConfidenceInput,
} from "./types/confidenceTypes";

export function validateConfidenceProposal(
  input: DeterministicConfidenceInput,
): readonly DeterministicConfidenceError[] {
  const proposal = input.proposalIntegrityResult.proposal;
  const errors: DeterministicConfidenceError[] = [];

  if (proposal.executionAuthorized || proposal.executable || proposal.orchestrationAllowed || proposal.runtimeMutationAllowed) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_EXECUTION_SEMANTIC",
      message: "Confidence scoring cannot operate on proposals that expose execution or runtime mutation semantics.",
      path: "proposalIntegrityResult.proposal",
    });
  }

  const suspiciousScope = proposal.scopeBoundaries.find((scope) =>
    CONFIDENCE_BLOCKED_SEMANTICS.some((token) =>
      `${scope.domain} ${scope.description}`.toLowerCase().includes(token)
    )
  );

  if (suspiciousScope) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_AUTHORITY_ESCALATION",
      message: "Confidence scoring detected hidden authority or execution semantics in proposal scope boundaries.",
      path: "proposalIntegrityResult.proposal.scopeBoundaries",
    });
  }

  return Object.freeze(errors);
}
