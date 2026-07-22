export type MessagingCoreDecision = "CORE_ACTIVATED" | "ACTIVE_WITH_OBSERVATIONS" | "CONDITIONALLY_ACTIVE" | "NOT_ACTIVE" | "FAIL_CLOSED";
export type MessagingCoreFailure =
  | "W1_1A_IDENTITY_CORE_INVALID"
  | "W1_2A_STORAGE_CORE_INVALID"
  | "MESSAGING_ARCHITECTURE_MISSING"
  | "MESSAGING_TOPOLOGY_INVALID"
  | "DELIVERY_SEMANTICS_INVALID"
  | "MESSAGE_INFRASTRUCTURE_MISSING"
  | "MESSAGE_BROKER_UNAVAILABLE"
  | "MESSAGING_CLUSTER_UNHEALTHY"
  | "COMMAND_TRANSPORT_MISSING"
  | "COMMAND_ORDERING_NON_DETERMINISTIC"
  | "COMMAND_DELIVERY_UNRELIABLE"
  | "COMMAND_PROCESSING_NOT_IDEMPOTENT"
  | "COMMAND_AUTHORIZATION_MISSING"
  | "EVENT_TRANSPORT_MISSING"
  | "EVENT_IMMUTABILITY_VIOLATED"
  | "EVENT_ORDERING_NON_DETERMINISTIC"
  | "EVENT_REPLAY_INCOMPATIBLE"
  | "TENANT_AWARE_MESSAGING_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "NAMESPACE_SEPARATION_VIOLATED"
  | "CROSS_TENANT_MESSAGE_ALLOWED"
  | "RETRY_SERVICES_MISSING"
  | "RETRY_POLICY_INVALID"
  | "RETRY_LIMITS_MISSING"
  | "FAILURE_ESCALATION_MISSING"
  | "DLQ_MISSING"
  | "FAILED_MESSAGE_CAPTURE_FAILED"
  | "DLQ_RECOVERY_WORKFLOW_MISSING"
  | "ADMINISTRATIVE_REPLAY_UNCONTROLLED"
  | "MESSAGE_PERSISTENCE_MISSING"
  | "PERSISTENT_QUEUES_UNAVAILABLE"
  | "MESSAGE_LINEAGE_MISSING"
  | "TRANSACTION_METADATA_MISSING"
  | "MESSAGING_SECURITY_MISSING"
  | "AUTHENTICATED_CONNECTIONS_FAILED"
  | "AUTHORIZED_ROUTING_FAILED"
  | "TRANSPORT_ENCRYPTION_MISSING"
  | "IDENTITY_VALIDATION_FAILED"
  | "OBSERVABILITY_MISSING"
  | "QUEUE_METRICS_MISSING"
  | "DELIVERY_METRICS_MISSING"
  | "RETRY_METRICS_MISSING"
  | "LATENCY_METRICS_MISSING"
  | "FAILURE_METRICS_MISSING"
  | "MESSAGING_AUDIT_MISSING"
  | "DELIVERY_EVIDENCE_MISSING"
  | "RETRY_EVIDENCE_MISSING"
  | "FAILURE_EVIDENCE_MISSING"
  | "TRANSPORT_LINEAGE_MISSING"
  | "MESSAGING_AUDIT_NOT_IMMUTABLE"
  | "MESSAGING_QUALIFICATION_FAILED"
  | "CORE_ACTIVATION_FAILED";
export type MessagingCoreScenario = "BASELINE" | "ACTIVE_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | MessagingCoreFailure;
export type MessagingCoreInput = Readonly<{ scenario?: MessagingCoreScenario; seed?: string }>;
export type MessagingArchitecture = Readonly<{ architecture_id: string; transport_model: boolean; routing_model: boolean; delivery_semantics: boolean; reliability_model: boolean; topology_defined: boolean; integrity_hash: string }>;
export type MessageInfrastructure = Readonly<{ infrastructure_id: string; message_broker: boolean; messaging_cluster: boolean; transport_services: boolean; broker_configuration: boolean; services_healthy: boolean; integrity_hash: string }>;
export type CommandTransport = Readonly<{ bus_id: string; command_queues: readonly string[]; delivery_acknowledgement: boolean; command_routing: boolean; ordered_delivery: boolean; guaranteed_processing: boolean; idempotent_handling: boolean; authorization_integration: boolean; integrity_hash: string }>;
export type EventTransport = Readonly<{ bus_id: string; event_topics: readonly string[]; publishers: boolean; subscribers: boolean; immutable_events: boolean; publish_subscribe_model: boolean; ordered_publication: boolean; replay_compatible: boolean; integrity_hash: string }>;
export type TenantAwareMessaging = Readonly<{ routing_id: string; tenant_routing: boolean; namespace_routing: boolean; isolation_policies: boolean; transport_boundaries: boolean; authorization_enforcement: boolean; cross_tenant_prevention: boolean; integrity_hash: string }>;
export type RetryServices = Readonly<{ engine_id: string; retry_policies: boolean; exponential_backoff: boolean; retry_scheduler: boolean; automatic_retry: boolean; configurable_policies: boolean; retry_limits: boolean; failure_escalation: boolean; integrity_hash: string }>;
export type DeadLetterQueue = Readonly<{ queue_id: string; failure_registry: boolean; recovery_workflow: boolean; dlq_monitoring: boolean; failed_message_capture: boolean; root_cause_analysis: boolean; administrative_replay: boolean; integrity_hash: string }>;
export type DurableMessagePersistence = Readonly<{ persistence_id: string; persistent_queues: boolean; message_storage: boolean; transaction_metadata: boolean; message_lineage: boolean; replay_storage: boolean; audit_storage: boolean; integrity_hash: string }>;
export type MessagingSecurity = Readonly<{ security_id: string; authenticated_connections: boolean; authorized_routing: boolean; transport_encryption: boolean; identity_validation: boolean; credential_validation: boolean; integrity_hash: string }>;
export type MessagingObservability = Readonly<{ monitoring_id: string; queue_metrics: boolean; delivery_metrics: boolean; retry_metrics: boolean; latency_metrics: boolean; failure_metrics: boolean; health_monitoring: boolean; integrity_hash: string }>;
export type MessagingAuditEvidence = Readonly<{ ledger_id: string; records: readonly string[]; delivery_evidence: boolean; retry_evidence: boolean; failure_evidence: boolean; transport_lineage: boolean; immutable: boolean; integrity_hash: string }>;
export type MessagingQualification = Readonly<{ report_id: string; command_delivery_verified: boolean; event_delivery_verified: boolean; ordering_deterministic: boolean; retry_validated: boolean; dlq_validated: boolean; tenant_isolation_verified: boolean; identity_enforcement_verified: boolean; durable_persistence_verified: boolean; monitoring_operational: boolean; audit_evidence_complete: boolean; activation_recommendation: boolean; integrity_hash: string }>;
export type MessagingCoreReadiness = Readonly<{ readiness_id: string; decision: MessagingCoreDecision; phase_ready: boolean; dependencies_ready: boolean; architecture_ready: boolean; infrastructure_ready: boolean; command_ready: boolean; event_ready: boolean; tenant_messaging_ready: boolean; retry_ready: boolean; dlq_ready: boolean; persistence_ready: boolean; security_ready: boolean; observability_ready: boolean; audit_ready: boolean; qualification_ready: boolean; failures: readonly MessagingCoreFailure[]; integrity_hash: string }>;
export type MessagingCoreResult = Readonly<{ phase_version: "messaging-core/w1.3a"; phase_identifier: "MessagingCore"; identity_core_ref: "identity-core/w1.1a"; storage_core_ref: "storage-core/w1.2a"; architecture: MessagingArchitecture; infrastructure: MessageInfrastructure; command_transport: CommandTransport; event_transport: EventTransport; tenant_messaging: TenantAwareMessaging; retry_services: RetryServices; dead_letter_queue: DeadLetterQueue; persistence: DurableMessagePersistence; security: MessagingSecurity; observability: MessagingObservability; audit_evidence: MessagingAuditEvidence; qualification: MessagingQualification; readiness: MessagingCoreReadiness; replay_hash: string; integrity_hash: string }>;
export type MessagingCoreValidation = Readonly<{ valid: boolean; decision: MessagingCoreDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; infrastructure_valid: boolean; command_valid: boolean; event_valid: boolean; tenant_valid: boolean; retry_valid: boolean; dlq_valid: boolean; persistence_valid: boolean; security_valid: boolean; observability_valid: boolean; audit_valid: boolean; qualification_valid: boolean; readiness_valid: boolean; failures: readonly MessagingCoreFailure[]; integrity_hash: string }>;
export type MessagingCoreBundle = Readonly<{ doctrine: Readonly<{ version: "messaging-core/w1.3a"; owns_command_transport: true; owns_event_transport: true; owns_retry_services: true; owns_dead_letter_queue: true; owns_tenant_aware_messaging: true; owns_message_persistence: true; owns_transport_monitoring: true; owns_messaging_audit: true }>; result: MessagingCoreResult; validation: MessagingCoreValidation }>;
