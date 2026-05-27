import { hashProposalIntegrityValue } from "./proposalHashEngine";

export function hashProposalAuditValue(scope: string, value: unknown): string {
  return hashProposalIntegrityValue(`proposal-audit:${scope}`, value);
}
