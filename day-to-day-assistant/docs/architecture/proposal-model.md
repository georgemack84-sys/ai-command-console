# Proposal Model

Phase D2D.8 introduces action proposals as the only assistant-originated path to application writes.

An action proposal records the tool name, title, summary, affected records, before and after state, expected changes, risk notes, rollback availability, authority level, expiration, status, confirmations, executions, and approval history. Proposals start in `AWAITING_CONFIRMATION`, can expire, and become immutable for execution once approved.

The model intentionally stores the proposed tool input as data. The assistant may suggest that data, but the server validates it and only the action gateway can execute it.
