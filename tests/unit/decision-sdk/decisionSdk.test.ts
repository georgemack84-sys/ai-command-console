import { describe, expect, it } from "vitest";
import {
  buildDecisionSdkObservability,
  createDecisionContract,
  createDecisionSdk,
  createSdkContext,
  deserializeDecision,
  getDecisionSdkContract,
  getDecisionSdkSample,
  inspectDecisionContract,
  loadDecisionContract,
  prepareIntegrityHash,
  replayValidation,
  serializeDecision,
  serializeReplayArtifacts,
  upgradeContractVersion,
  validateAuthority,
  validateContractCompatibility,
  validateDecisionContract,
  validateGovernance,
  validateIntegrity,
  validateLineage,
  validateSchema,
} from "@/services/decision-sdk";

describe("decision orchestration APIs and developer SDK", () => {
  it("exposes a versioned SDK contract and typed error model", () => {
    const contract = getDecisionSdkContract();

    expect(contract.sdk_version).toBe("1.0.0");
    expect(contract.api_version).toBe("1.0.0");
    expect(contract.supported_error_classes).toContain("AUTHENTICATION_ERROR");
    expect(contract.compatible_validation_error_classes).toContain("INTEGRITY_ERROR");
  });

  it("creates canonical contracts with deterministic invocation metadata", () => {
    const context = createSdkContext();
    const response = createDecisionContract(context);

    expect(response.ok).toBe(true);
    expect(response.data?.tenant_id).toBe(context.tenant_id);
    expect(response.invocation.api_name).toBe("createDecisionContract");
    expect(response.invocation.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed when authentication context is missing", () => {
    const context = createSdkContext({ authenticated_identity: "" });
    const response = validateDecisionContract(context);

    expect(response.ok).toBe(false);
    expect(response.error?.error_class).toBe("AUTHENTICATION_ERROR");
    expect(response.invocation.validation_status).toBe("FAIL");
  });

  it("runs validation APIs through deterministic domain wrappers", () => {
    expect(validateDecisionContract().data?.validation_result).toBe("PASS");
    expect(validateSchema().data?.validation_result).toBe("PASS");
    expect(validateGovernance().data?.validation_result).toBe("PASS");
    expect(validateAuthority().data?.validation_result).toBe("PASS");

    const lineage = validateLineage(createSdkContext(), { scenario: "LINEAGE_CORRUPTION" });
    const integrity = validateIntegrity(createSdkContext(), { scenario: "INTEGRITY_MISMATCH" });

    expect(lineage.data?.validation_result).toBe("FAIL");
    expect(integrity.data?.validation_result).toBe("FAIL");
  });

  it("loads, inspects, upgrades, and checks compatible contracts", () => {
    const context = createSdkContext();
    const contract = createDecisionContract(context).data!;
    const serialized = serializeDecision(context, contract).data!;
    const loaded = loadDecisionContract(context, JSON.stringify(serialized));
    const upgraded = upgradeContractVersion(context, contract);
    const compatibility = validateContractCompatibility(context, "1.0.0", "1.0.0");
    const incompatible = validateContractCompatibility(context, "2.0.0", "1.0.0");
    const inspection = inspectDecisionContract(context, contract);

    expect(loaded.ok).toBe(true);
    expect(upgraded.data?.contract_version).toBe("1.0.0");
    expect(compatibility.data?.compatible).toBe(true);
    expect(incompatible.data?.compatible).toBe(false);
    expect(inspection.data?.advisory_only).toBe(true);
  });

  it("serializes, deserializes, hashes, and replays deterministically", () => {
    const context = createSdkContext();
    const contract = createDecisionContract(context).data!;
    const serialized = serializeDecision(context, contract);
    const deserialized = deserializeDecision(context, JSON.stringify(serialized.data));
    const replayArtifacts = serializeReplayArtifacts(context);
    const hash = prepareIntegrityHash(context, contract);
    const validation = validateDecisionContract(context).data!;
    const replay = replayValidation(context, validation);

    expect(serialized.data?.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(deserialized.data?.orchestration_id).toBe(contract.orchestration_id);
    expect(replayArtifacts.data?.payload).toContain("replay_contract_id");
    expect(hash.data).toMatch(/^[a-f0-9]{64}$/);
    expect(replay.data?.replay_valid).toBe(true);
  });

  it("provides deterministic builders and a unified SDK client shell", () => {
    const client = createDecisionSdk();
    const decision = client.builders.DecisionBuilder();
    const metadata = client.builders.MetadataBuilder();
    const replay = client.builders.ReplayBuilder();
    const lineage = client.builders.LineageBuilder();
    const integrity = client.builders.IntegrityBuilder();

    expect(decision.record.input.tenant_id).toBe(client.context.tenant_id);
    expect(metadata.created_by).toBe(client.context.authenticated_identity);
    expect(replay.replay_reference_ids.length).toBeGreaterThan(0);
    expect(lineage.lineage_id).toContain("lineage_");
    expect(integrity.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(client.invocations()).toEqual([]);
  });

  it("emits SDK observability and deterministic samples", () => {
    const context = createSdkContext({ authenticated_identity: "" });
    const responses = [
      createDecisionContract(),
      validateDecisionContract(),
      validateDecisionContract(context),
      validateContractCompatibility(createSdkContext(), "2.0.0", "1.0.0"),
    ];

    const observability = buildDecisionSdkObservability(responses);
    const sample = getDecisionSdkSample();

    expect(observability.api_invocation_count).toBe(4);
    expect(observability.authentication_failures).toBe(1);
    expect(observability.compatibility_failures).toBe(1);
    expect(observability.sdk_version_adoption["1.0.0"]).toBe(4);
    expect(sample.validation.data?.validation_result).toBe("PASS");
  });
});
