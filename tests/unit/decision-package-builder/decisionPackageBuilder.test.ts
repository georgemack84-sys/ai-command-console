import { describe, expect, it } from "vitest";
import { computeOperatorDecisionPackageHash, createOperatorDecisionPackage, validateDecisionPackageContract } from "@/services/decision-package-contract";
import {
  REQUIRED_PACKAGE_SECTIONS,
  buildDecisionPackage,
  getDecisionPackageBuilderFoundation,
  replayDecisionPackageBuilder,
} from "@/services/decision-package-builder";

describe("Mission Control Phase 9.8.2 Decision Package Builder", () => {
  it("publishes the decision package builder foundation", () => {
    const foundation = getDecisionPackageBuilderFoundation();

    expect(foundation.builder_version).toBe("decision-package-builder/v1");
    expect(foundation.required_sections).toEqual(REQUIRED_PACKAGE_SECTIONS);
    expect(foundation.result.builder_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("assembles canonical packages deterministically", () => {
    const first = buildDecisionPackage();
    const second = buildDecisionPackage();

    expect(first).toEqual(second);
    expect(first.assembly_record.assembly_status).toBe("VERIFIED");
    expect(first.completeness_report.validation_status).toBe("COMPLETE");
    expect(first.completeness_report.completeness_score).toBe(1);
    expect(first.integrity_result.verification_status).toBe("VERIFIED");
    expect(first.build_ledger).toHaveLength(1);
  });

  it("preserves all mandatory package sections and contract validation", () => {
    const result = buildDecisionPackage();

    expect(result.assembly_pipeline).toEqual(REQUIRED_PACKAGE_SECTIONS);
    expect(result.completeness_report.completed_sections).toEqual(REQUIRED_PACKAGE_SECTIONS);
    expect(result.contract_result.contract_status).toBe("PASS");
    expect(result.validation.checks.schema_compliant).toBe(true);
    expect(result.validation.checks.authority_visible).toBe(true);
    expect(result.validation.checks.advisory_only).toBe(true);
  });

  it("fails closed when mandatory sections are missing", () => {
    const pkg = createOperatorDecisionPackage();
    const missingRecommendation = { ...pkg, recommended_option: { ...pkg.recommended_option, option_id: "" }, integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, recommended_option: { ...pkg.recommended_option, option_id: "" } }) };
    const noEvidence = { ...pkg, evidence_summary: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, evidence_summary: "" }) };
    const noGovernance = { ...pkg, governance_summary: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, governance_summary: "" }) };
    const noConstitution = { ...pkg, constitutional_summary: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, constitutional_summary: "" }) };
    const noAuthority = { ...pkg, authority_summary: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, authority_summary: "" }) };

    expect(buildDecisionPackage({ package: missingRecommendation }).failures).toContain("RECOMMENDATION_MISSING");
    expect(buildDecisionPackage({ package: noEvidence }).failures).toContain("EVIDENCE_MISSING");
    expect(buildDecisionPackage({ package: noGovernance }).failures).toContain("GOVERNANCE_SUMMARY_MISSING");
    expect(buildDecisionPackage({ package: noConstitution }).failures).toContain("CONSTITUTIONAL_SUMMARY_MISSING");
    expect(buildDecisionPackage({ package: noAuthority }).failures).toContain("AUTHORITY_SUMMARY_MISSING");
  });

  it("rejects replay gaps, lineage gaps, integrity failures, tenant mismatch, and advisory-only violations", () => {
    const pkg = createOperatorDecisionPackage();
    const noReplay = { ...pkg, replay_ref: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, replay_ref: "" }) };
    const noLineage = { ...pkg, lineage_ref: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, lineage_ref: "" }) };
    const tampered = { ...pkg, rationale: "tampered" };
    const wrongTenant = { ...pkg, tenant_id: "tenant_beta", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, tenant_id: "tenant_beta" }) };
    const executionPackage = { ...pkg, advisory_only: false as true, integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, advisory_only: false as true }) };

    expect(buildDecisionPackage({ package: noReplay }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(buildDecisionPackage({ package: noLineage }).failures).toContain("LINEAGE_REFERENCE_MISSING");
    expect(buildDecisionPackage({ package: tampered }).failures).toContain("INTEGRITY_CALCULATION_FAILED");
    expect(buildDecisionPackage({ package: wrongTenant }).failures).toContain("TENANT_MISMATCH_DETECTED");
    expect(buildDecisionPackage({ package: executionPackage }).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("detects duplicate sections, invalid ordering, contract failure, unauthorized access, and replay divergence", () => {
    const valid = buildDecisionPackage();
    const pkg = createOperatorDecisionPackage();
    const badContract = validateDecisionPackageContract({ package: { ...pkg, governance_summary: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, governance_summary: "" }) } });

    expect(buildDecisionPackage({ assembled_sections: ["Recommendation", "Recommendation"] }).failures).toContain("DUPLICATE_SECTION");
    expect(buildDecisionPackage({ assembled_sections: ["Replay", "Recommendation"] }).failures).toContain("SECTION_ORDER_INVALID");
    expect(buildDecisionPackage({ contract_result: badContract }).failures).toContain("CONTRACT_VALIDATION_FAILED");
    expect(buildDecisionPackage({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_PACKAGE_BUILDER_ACCESS");
    expect(buildDecisionPackage({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("records immutable package build ledgers", () => {
    const result = buildDecisionPackage();
    const ledger = result.build_ledger[0]!;

    expect(ledger.package_id).toBe(result.package.package_id);
    expect(ledger.schema_version).toBe("operator-decision-package-schema/v1");
    expect(ledger.generator_version).toBe("decision-package-builder/v1");
    expect(ledger.append_only).toBe(true);
    expect(ledger.deleted).toBe(false);
  });

  it("replays package assembly deterministically", () => {
    const result = buildDecisionPackage();
    const replay = replayDecisionPackageBuilder(result);
    const tampered = replayDecisionPackageBuilder({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.completed_sections).toEqual(REQUIRED_PACKAGE_SECTIONS);
    expect(replay.completeness_score).toBe(1);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
