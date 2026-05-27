import type { ProposalReplaySnapshotBundle } from "./replayTypes";

export function resolveReplayValidatorSnapshotIds(bundle: ProposalReplaySnapshotBundle): readonly string[] {
  const validatorVersionSet = bundle.validatorVersionSet;
  return Object.freeze([
    validatorVersionSet.transitionValidatorVersion,
    validatorVersionSet.policyValidatorVersion,
    validatorVersionSet.authorityValidatorVersion,
    validatorVersionSet.approvalValidatorVersion,
    validatorVersionSet.replayValidatorVersion,
    validatorVersionSet.freezeValidatorVersion,
    validatorVersionSet.revocationValidatorVersion,
  ]);
}
