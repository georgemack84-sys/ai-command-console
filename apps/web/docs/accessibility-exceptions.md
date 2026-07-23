# Accessibility exception register

This register is intentionally empty at the start of Week 2 validation. Do not use an exception to silently waive an accessibility requirement.

| ID        | Requirement and affected route/story                                              | User impact                                     | Mitigation                                                                   | Owner             | Expiry date | Approval                   |
| --------- | --------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- | ----------------- | ----------- | -------------------------- |
| W2-SB-001 | Storybook static build emits a chunk-size warning for the third-party Axe bundle. | No production impact; Storybook remains usable. | Track vendor bundle separately; no application code is excluded from checks. | Frontend platform | 2026-10-31  | Pending engineering review |

Every accepted exception must have a concrete owner, a mitigation, and an expiry date. Expired exceptions block the Week 2 exit gate until they are resolved or explicitly renewed.
