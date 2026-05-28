import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import type {
  ConstitutionalTransitionError,
  ConstitutionalTransitionLedgerEntry,
  ConstitutionalTransitionLineageLedger,
} from "./types/constitutionalTransitionTypes";
import { ConstitutionalTransitionErrorCode } from "./types/constitutionalTransitionTypes";

export function validateImmutableTransition(input: {
  lineage: ConstitutionalTransitionLineageLedger;
  auditLedger: readonly ConstitutionalTransitionLedgerEntry[];
}): readonly ConstitutionalTransitionError[] {
  const appendOnlyValid = verifyImmutableLedgerChain([...input.auditLedger]);
  const lineageConsistent = input.lineage.entries.length > 0 && input.lineage.lineageHash.length > 0;
  return appendOnlyValid && lineageConsistent
    ? Object.freeze([])
    : Object.freeze([{
      code: ConstitutionalTransitionErrorCode.APPEND_ONLY_VIOLATION,
      message: "Transition lineage or audit ledger violated append-only guarantees.",
      path: !appendOnlyValid ? "auditLedger" : "lineage",
    }]);
}
