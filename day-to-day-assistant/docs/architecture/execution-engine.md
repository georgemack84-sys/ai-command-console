# Execution Engine

Phase D2D.8 execution is proposal-bound, token-bound, and idempotent.

Execution begins only after a proposal is approved and a server-generated action token is supplied. Tokens are short lived and one-time use. Repeated requests with the same idempotency key return the existing execution record instead of duplicating application state.

Execution is complete only after verification. Verification checks that the domain service returned a record that can be read back through the same authenticated application service. Unknown verification is not reported as success.

Rollback records are written for every execution. Supported rollback strategies currently include deleting records created through approved create actions and reopening tasks completed through the gateway.
