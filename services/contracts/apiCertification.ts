import { evaluateCertificationChecklist } from "./certificationChecklist";

export function certifyApiContract(input: Parameters<typeof evaluateCertificationChecklist>[0]) {
  return evaluateCertificationChecklist(input);
}
