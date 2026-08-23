import type { DerivedSkillState, SkillGraphRepository, SkillStateCalculation } from "../../types/learning-constitution/skillGraph";
import { calculateDerivedSkillState } from "./skillStateCalculator";

export class SkillStateRecalculationService {
  constructor(private readonly repository: SkillGraphRepository, private readonly policy: SkillStateCalculation) {}
  async recalculate(learnerId: string, skillId: string): Promise<DerivedSkillState> {
    if (!await this.repository.getNode(skillId)) throw new Error("cannot calculate state for an unknown skill");
    return calculateDerivedSkillState(learnerId, skillId, await this.repository.findEvidenceBySkillId(skillId), this.policy);
  }
  async recalculateAll(learnerId: string): Promise<readonly DerivedSkillState[]> {
    const nodes = await this.repository.findAllNodes();
    return Promise.all(nodes.map((node) => this.recalculate(learnerId, node.id)));
  }
}
