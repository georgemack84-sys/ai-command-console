import type {
  OperationalPolicyRepository,
  OperationalPolicyVersion,
} from "../../types/learning-constitution/operationalPolicy";

export class InMemoryOperationalPolicyRepository implements OperationalPolicyRepository {
  private readonly versions = new Map<string, OperationalPolicyVersion>();
  private readonly activeByPolicyScope = new Map<string, OperationalPolicyVersion>();

  async getByPolicyVersion(policyId: string, version: string, scopeKey: string): Promise<OperationalPolicyVersion | undefined> {
    return this.versions.get(`${policyId}:${scopeKey}:${version}`);
  }

  async getActive(policyId: string, scopeKey: string): Promise<OperationalPolicyVersion | undefined> {
    return this.activeByPolicyScope.get(`${policyId}:${scopeKey}`);
  }

  async findAllByPolicyScope(policyId: string, scopeKey: string): Promise<readonly OperationalPolicyVersion[]> {
    return [...this.versions.values()]
      .filter((version) => version.policyId === policyId && version.scopeKey === scopeKey)
      .sort((left, right) => left.activatedAt.localeCompare(right.activatedAt) || left.version.localeCompare(right.version));
  }

  async activate(version: OperationalPolicyVersion): Promise<OperationalPolicyVersion> {
    const versionKey = `${version.policyId}:${version.scopeKey}:${version.version}`;
    const existing = this.versions.get(versionKey);
    if (existing) return existing;
    this.versions.set(versionKey, version);
    this.activeByPolicyScope.set(`${version.policyId}:${version.scopeKey}`, version);
    return version;
  }

  async reactivate(policyId: string, version: string, scopeKey: string): Promise<OperationalPolicyVersion> {
    const target = this.versions.get(`${policyId}:${scopeKey}:${version}`);
    if (!target) throw new Error("rollback policy version is missing");
    this.activeByPolicyScope.set(`${policyId}:${scopeKey}`, target);
    return target;
  }
}
