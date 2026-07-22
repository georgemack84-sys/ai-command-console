import { describe, expect, it } from "vitest";

import { getWaveFiveApplicationPlatformBundle, replayWaveFiveApplicationPlatform, runWaveFiveApplicationPlatform, validateWaveFiveApplicationPlatform } from "@/services/wave-five-application-platform";
import type { WaveFiveApplicationPlatformFailure } from "@/types/wave-five-application-platform";

const conditionalFailures = ["ARCHITECTURE_NOT_APPROVED", "SERVICE_BOUNDARIES_MISSING", "CONTRACTS_NOT_VERSIONED", "INVARIANT_REGISTRY_MISSING", "AUTHORITY_BOUNDARIES_UNDOCUMENTED", "EVIDENCE_RESPONSIBILITIES_UNASSIGNED", "SHELL_CANNOT_LOAD_REGISTERED_APPLICATIONS", "SHELL_CONTEXT_NOT_ISOLATED", "SHELL_STATES_INCOMPLETE", "SHELL_FAILURE_STATES_IMPLICIT", "SESSION_EXPIRATION_DOES_NOT_REVOKE_STATE", "NAVIGATION_NOT_PERMISSION_AWARE", "DEEP_LINK_AUTHORIZATION_MISSING", "INVALID_ROUTE_DOES_NOT_FAIL_SAFELY", "DEPRECATED_ROUTE_MIGRATION_UNGOVERNED", "SAVED_VIEW_RETURNS_REVOKED_ACCESS", "SEARCH_TENANT_FILTER_MISSING", "SEARCH_PROVIDER_LINEAGE_MISSING", "SEARCH_FAILURE_DOES_NOT_DEGRADE", "COMPONENT_ACCESSIBILITY_BASELINE_FAILED", "STATUS_SEMANTICS_AMBIGUOUS", "COLOR_ONLY_STATUS_MEANING", "SDK_CONTRACT_MISMATCH", "SDK_CONTEXT_PROPAGATION_MISSING", "SDK_REQUESTS_NONDETERMINISTIC", "GATEWAY_IDENTITY_VALIDATION_MISSING", "GATEWAY_CONTEXT_VALIDATION_MISSING", "GATEWAY_STANDING_ENFORCEMENT_MISSING", "GATEWAY_REPLAY_DIVERGES", "NOTIFICATIONS_NOT_PERMISSION_AWARE", "NOTIFICATION_DEEP_LINK_AUTHORIZATION_MISSING", "NOTIFICATION_EVIDENCE_MISSING", "PERMISSION_REVOCATION_LEAKS_CONTENT", "PERMISSION_CACHE_INVALIDATION_MISSING", "COMMAND_IDEMPOTENCY_MISSING", "COMMAND_ADMISSION_ORDER_BROKEN", "DENIED_COMMAND_RESUBMITTED_AUTOMATICALLY", "COMMAND_LINEAGE_INCOMPLETE", "TELEMETRY_CORRELATION_MISSING", "SENSITIVE_VALUES_NOT_REDACTED", "REPLAY_METADATA_INSUFFICIENT", "TENANT_ISOLATED_TELEMETRY_MISSING", "DEVELOPER_TOOLING_INCOMPLETE", "REFERENCE_APPLICATION_MISSING", "CONTRACT_VALIDATION_NOT_AUTOMATED", "ACCESSIBILITY_CHECKS_NOT_IN_CI", "SECURITY_CHECKS_NOT_IN_CI"] as const satisfies readonly WaveFiveApplicationPlatformFailure[];
const notQualifiedFailures = ["W5_APPLICATION_FOUNDATION_INVALID", "SHELL_FABRICATES_DATA", "CROSS_TENANT_ROUTE_ALLOWED", "SEARCH_RETURNS_UNAUTHORIZED_METADATA", "SEARCH_EXECUTION_BYPASS", "ADVISORY_OUTPUT_RESEMBLES_COMMAND", "COMPONENT_INFERS_AUTHORIZATION", "SDK_EMBEDS_SECRETS", "SDK_DIRECT_INFRASTRUCTURE_COUPLING", "GATEWAY_BYPASS_AVAILABLE", "GATEWAY_DOES_NOT_FAIL_CLOSED", "NOTIFICATIONS_AUTHORIZE_ACTIONS", "CLIENT_PERMISSION_TREATED_AS_AUTHORITY", "RESTRICTIONS_RELAXED_BY_INTERFACE", "COMMAND_EXECUTES_DIRECTLY", "COMMAND_OVERSIGHT_BYPASS", "EVIDENCE_LINEAGE_INCOMPLETE"] as const satisfies readonly WaveFiveApplicationPlatformFailure[];

describe("Wave 5.1 Application Platform", () => {
  it("publishes the application platform doctrine", () => {
    const bundle = getWaveFiveApplicationPlatformBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-application-platform/w5.1", application_platform_is_interaction_layer: true, application_platform_is_not_execution_authority: true, gateway_enforcement_required: true, backend_authorization_required: true, tenant_isolation_required: true, evidence_lineage_required: true, qualification_gate: "W5.1 Application Platform Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes W5.0 as the upstream foundation", () => {
    const first = runWaveFiveApplicationPlatform({ seed: "deterministic" });
    const second = runWaveFiveApplicationPlatform({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["wave-five-application-portfolio-foundation/w5.0"]);
    expect(first.contracts).toEqual(["ApplicationShellContract", "ApplicationContextContract", "NavigationEntryContract", "NavigationRouteContract", "SearchProviderContract", "SearchQueryContract", "SearchResultContract", "SharedComponentContract", "ApplicationSDKContract", "ApplicationGatewayContract", "GatewayRouteContract", "NotificationContract", "NotificationPreferenceContract", "PermissionContextContract", "PermissionQueryContract", "CommandDefinitionContract", "CommandSubmissionContract", "CommandStatusContract", "ApplicationPlatformEventContract", "ApplicationErrorContract"]);
    expect(first.invariants).toHaveLength(15);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveApplicationPlatform(first).valid).toBe(true);
    expect(replayWaveFiveApplicationPlatform()).toBe(true);
  });

  it("approves architecture, contracts, and application shell states", () => {
    const result = runWaveFiveApplicationPlatform();

    expect(result.architecture).toMatchObject({ platform_architecture: true, service_boundary_model: true, component_ownership_model: true, interaction_model: true, frontend_backend_separation: true, gateway_integration_model: true, context_models: true, command_submission_model: true, evidence_integration_model: true, error_degradation_model: true, versioning_strategy: true, compatibility_strategy: true, authority_boundaries_documented: true, evidence_responsibilities_assigned: true, approved: true });
    expect(result.shell.states).toEqual(["INITIALIZING", "AUTHENTICATING", "LOADING_CONTEXT", "READY", "DEGRADED", "ACCESS_RESTRICTED", "APPLICATION_SUSPENDED", "SESSION_EXPIRED", "UNAVAILABLE"]);
    expect(result.shell).toMatchObject({ application_loading: true, identity_session_integration: true, tenant_namespace_context: true, protected_content_withheld_when_restricted: true, no_fabricated_data: true, session_expiration_revokes_state: true });
  });

  it("enforces deterministic navigation and governed search discovery", () => {
    const result = runWaveFiveApplicationPlatform();

    expect(result.navigation).toMatchObject({ route_registry: true, route_guards: true, permission_aware_resolution: true, tenant_aware_resolution: true, namespace_aware_resolution: true, deep_link_checks: true, cross_application_navigation: true, invalid_route_fail_safe: true, saved_views_revalidate_permissions: true, deterministic_routing: true });
    expect(result.search).toMatchObject({ search_interface: true, provider_registry: true, federated_orchestration: true, permission_filtering: true, tenant_filtering: true, namespace_filtering: true, result_contract: true, result_provenance: true, no_metadata_leakage: true, degradation_handling: true, no_execution_bypass: true });
    expect(runWaveFiveApplicationPlatform({ scenario: "CROSS_TENANT_ROUTE_ALLOWED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApplicationPlatform({ scenario: "SEARCH_RETURNS_UNAUTHORIZED_METADATA" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApplicationPlatform({ scenario: "SEARCH_EXECUTION_BYPASS" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("qualifies shared components and SDK contracts without authorization inference or secrets", () => {
    const result = runWaveFiveApplicationPlatform();

    expect(result.components).toMatchObject({ design_tokens: true, core_components: true, governed_status_components: true, accessibility_utilities: true, component_test_harness: true, status_semantics_unambiguous: true, advisory_authoritative_separation: true, keyboard_accessible: true, color_not_sole_indicator: true, no_authorization_inference: true, versioned: true });
    expect(result.sdk).toMatchObject({ typed_contracts: true, gateway_client: true, evidence_telemetry_clients: true, contract_schema_compatibility_validation: true, tenant_namespace_correlation_propagation: true, no_embedded_secrets: true, no_authorization_bypass: true, deterministic_request_construction: true });
    expect(runWaveFiveApplicationPlatform({ scenario: "ADVISORY_OUTPUT_RESEMBLES_COMMAND" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApplicationPlatform({ scenario: "COMPONENT_INFERS_AUTHORIZATION" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApplicationPlatform({ scenario: "SDK_EMBEDS_SECRETS" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("requires gateway enforcement and backend authorization preservation", () => {
    const result = runWaveFiveApplicationPlatform();

    expect(result.gateway).toMatchObject({ route_registry: true, identity_session_validation: true, tenant_namespace_validation: true, lifecycle_certification_validation: true, permission_authority_preconditions: true, schema_validation: true, response_filtering_redaction: true, evidence_audit_metrics: true, protected_calls_exclusive: true, fail_closed: true, deterministic_replay: true });
    expect(result.permissions).toMatchObject({ permission_context: true, permission_queries: true, route_controls: true, component_controls: true, access_denied_experience: true, cache_invalidation: true, backend_authority_preserved: true, revocation_prevents_content_exposure: true, restrictions_preserved: true, fail_closed_defaults: true });
    expect(runWaveFiveApplicationPlatform({ scenario: "GATEWAY_BYPASS_AVAILABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApplicationPlatform({ scenario: "GATEWAY_DOES_NOT_FAIL_CLOSED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApplicationPlatform({ scenario: "CLIENT_PERMISSION_TREATED_AS_AUTHORITY" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("keeps notifications advisory and commands non-executing", () => {
    const result = runWaveFiveApplicationPlatform();

    expect(result.notifications).toMatchObject({ notification_service: true, notification_center: true, templates_preferences_lifecycle: true, permission_aware_delivery: true, tenant_namespace_filtering: true, deep_link_authorization: true, acknowledgement_tracking: true, delivery_evidence: true, advisory_only: true, no_independent_authority: true });
    expect(result.commands).toMatchObject({ command_schema_registry: true, command_composer: true, validation_preview_confirmation: true, governed_submission: true, status_tracking: true, evidence_view: true, immutable_command_identity: true, idempotency_key_required: true, admission_order_preserved: true, no_direct_execution: true, oversight_not_bypassed: true, denied_outcomes_preserved: true, lineage_complete: true });
    expect(runWaveFiveApplicationPlatform({ scenario: "NOTIFICATIONS_AUTHORIZE_ACTIONS" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApplicationPlatform({ scenario: "COMMAND_EXECUTES_DIRECTLY" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveApplicationPlatform({ scenario: "COMMAND_OVERSIGHT_BYPASS" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("records evidence, telemetry, developer readiness, and qualification posture", () => {
    const result = runWaveFiveApplicationPlatform();

    expect(result.evidence_telemetry).toMatchObject({ event_model: true, navigation_search_notification_permission_gateway_command_events: true, correlation_identifiers: true, tenant_namespace_principal_context: true, application_sdk_gateway_contract_versions: true, evidence_links: true, replay_metadata: true, privacy_filtering: true, sensitive_data_redaction: true, tenant_isolated_telemetry: true, operational_dashboards: true, complete_lineage: true });
    expect(result.developer_experience).toMatchObject({ developer_portal: true, architecture_guide: true, sdk_component_gateway_guides: true, onboarding_guide: true, local_development_environment: true, reference_application: true, starter_templates: true, contract_validation_tools: true, linting_accessibility_security_checks: true, migration_troubleshooting_release_notes: true, reproducible_onboarding: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, invariants_satisfied: true, tenant_isolation_validated: true, backend_authorization_preserved: true, gateway_enforcement_validated: true, no_direct_execution: true, evidence_complete: true, replay_supporting_metadata: true, security_testing_passed: true, accessibility_testing_passed: true, operational_monitoring_active: true, reference_application_integrated: true, qualification_approved: true });
    expect(runWaveFiveApplicationPlatform({ scenario: "EVIDENCE_LINEAGE_INCOMPLETE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveApplicationPlatform({ scenario: failure });
    const validation = validateWaveFiveApplicationPlatform(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional invariant violation %s", (failure) => {
    const result = runWaveFiveApplicationPlatform({ scenario: failure });
    const validation = validateWaveFiveApplicationPlatform(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveApplicationPlatform({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveApplicationPlatform({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveApplicationPlatform({ scenario: "APPLICATION_PLATFORM_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveApplicationPlatform(notQualified).valid).toBe(false);
  });
});
