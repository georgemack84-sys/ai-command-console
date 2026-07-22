import { describe, expect, it } from "vitest";
import {
  getFormalDocumentTaxonomyBundle,
  replayFormalDocumentTaxonomy,
  runFormalDocumentTaxonomy,
  validateFormalDocumentTaxonomy,
} from "@/services/formal-document-taxonomy";
import type { FormalDocumentTaxonomyScenario } from "@/types/formal-document-taxonomy";

describe("Mission Control Phase 13.9 Formal Document Taxonomy", () => {
  it("publishes the governed taxonomy doctrine", () => {
    const bundle = getFormalDocumentTaxonomyBundle();

    expect(bundle.doctrine.version).toBe("formal-document-taxonomy/v13.9");
    expect(bundle.doctrine.document_types).toEqual(["ROADMAP", "SPECIFICATION", "AMENDMENT", "ADDENDUM", "RECONCILIATION_AMENDMENT"]);
    expect(bundle.doctrine.lifecycle_states).toEqual(["DRAFT", "REVIEW", "APPROVED", "ACTIVE", "SUPERSEDED", "ARCHIVED", "RETIRED"]);
    expect(bundle.doctrine.relationship_types).toContain("RECONCILES");
    expect(bundle.doctrine.canonical_classification_required).toBe(true);
    expect(bundle.doctrine.immutable_identity_required).toBe(true);
    expect(bundle.doctrine.replayability_required).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic taxonomy contracts and hashes", () => {
    const first = runFormalDocumentTaxonomy();
    const second = runFormalDocumentTaxonomy();

    expect(first.contract.document_type).toBe("SPECIFICATION");
    expect(first.contract.canonical_owner).toBe("owner:mission-control-governance");
    expect(first.contract.lifecycle_state).toBe("ACTIVE");
    expect(first.contract.approval_refs.length).toBeGreaterThan(0);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateFormalDocumentTaxonomy(first).valid).toBe(true);
    expect(replayFormalDocumentTaxonomy(first)).toBe(true);
  });

  it("defines canonical meanings for every document type", () => {
    const result = runFormalDocumentTaxonomy();

    expect(result.definitions).toHaveLength(5);
    expect(result.definitions.find((item) => item.document_type === "ROADMAP")?.normative).toBe(false);
    expect(result.definitions.find((item) => item.document_type === "ROADMAP")?.prohibited_semantics).toContain("implementation behavior");
    expect(result.definitions.find((item) => item.document_type === "SPECIFICATION")?.normative).toBe(true);
    expect(result.definitions.find((item) => item.document_type === "RECONCILIATION_AMENDMENT")?.prohibited_semantics).toContain("constitutional authority expansion");
    expect(result.classification.classification_unique).toBe(true);
    expect(result.classification.candidate_classifications).toEqual(["SPECIFICATION"]);
  });

  it("validates relationships, dependencies, lifecycle, and governance", () => {
    const result = runFormalDocumentTaxonomy();

    expect(result.relationships.outcome).toBe("VALID");
    expect(result.relationships.relationships.every((relationship) => relationship.directional && relationship.immutable_once_approved && relationship.legal)).toBe(true);
    expect(result.dependency_graph.acyclic).toBe(true);
    expect(result.dependencies.outcome).toBe("VALID");
    expect(result.lifecycle.transition_approved).toBe(true);
    expect(result.lifecycle.historical_validity_preserved).toBe(true);
    expect(result.governance.taxonomy_approved).toBe(true);
    expect(result.governance.classification_enforced).toBe(true);
  });

  it("preserves lineage, replay, integrity, and certification", () => {
    const result = runFormalDocumentTaxonomy();

    expect(result.lineage.complete).toBe(true);
    expect(result.lineage.immutable_audit).toBe(true);
    expect(result.replay.document_replayable).toBe(true);
    expect(result.replay.historical_versions_reproducible).toBe(true);
    expect(result.integrity.outcome).toBe("VALID");
    expect(result.integrity.reconciliation_required).toBe(false);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certified).toBe(true);
  });

  it.each([
    "MULTIPLE_DOCUMENT_TYPES",
    "UNKNOWN_DOCUMENT_TYPE",
    "OWNER_NOT_UNIQUE",
    "IDENTITY_MUTATED",
    "RELATIONSHIP_ILLEGAL",
    "RELATIONSHIP_CYCLE",
    "DEPENDENCY_MISSING",
    "DEPENDENCY_CONFLICTING",
    "LIFECYCLE_TRANSITION_INVALID",
    "GOVERNANCE_APPROVAL_MISSING",
    "VOCABULARY_MUTATION_UNAPPROVED",
    "LINEAGE_INCOMPLETE",
    "REPLAY_NONDETERMINISTIC",
    "INTEGRITY_VIOLATION",
  ] as const)("fails taxonomy certification for %s", (scenario: FormalDocumentTaxonomyScenario) => {
    const result = runFormalDocumentTaxonomy({ scenario });
    const validation = validateFormalDocumentTaxonomy(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested relationship tampering", () => {
    const result = runFormalDocumentTaxonomy();
    const tampered = {
      ...result,
      relationships: {
        ...result.relationships,
        relationships: [
          {
            ...result.relationships.relationships[0],
            target_document_id: "doc:tampered",
          },
          ...result.relationships.relationships.slice(1),
        ],
      },
    };

    expect(validateFormalDocumentTaxonomy(tampered).valid).toBe(false);
  });
});
