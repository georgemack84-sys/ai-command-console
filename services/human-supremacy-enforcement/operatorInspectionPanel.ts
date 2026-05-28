import type {
  OperatorInspectionPanel,
  OperatorInterventionType,
  SupremacyEnforcementState,
} from "./supremacyStateTypes";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function buildOperatorInspectionPanel(input: {
  supremacyId: string;
  operatorId: string;
  coordinationId: string;
  interventionType: OperatorInterventionType;
  enforcementState: SupremacyEnforcementState;
  evidenceHash: string;
}): OperatorInspectionPanel {
  return Object.freeze({
    panelId: hashSupremacyValue("human-supremacy-operator-panel-id", input.supremacyId),
    supremacyId: input.supremacyId,
    operatorId: input.operatorId,
    coordinationId: input.coordinationId,
    interventionType: input.interventionType,
    enforcementState: input.enforcementState,
    evidenceHash: input.evidenceHash,
    panelHash: hashSupremacyValue("human-supremacy-operator-panel", input),
  });
}
