# Accessibility exception register

This register is intentionally empty at the start of Week 2 validation. Do not use an exception to silently waive an accessibility requirement.

| ID          | Requirement and affected route/story                                                 | User impact                                                                          | Mitigation                                                                                                                                              | Owner             | Expiry date | Approval                   |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------- | -------------------------- |
| W2-SB-001   | Storybook static build emits a chunk-size warning for the third-party Axe bundle.    | No production impact; Storybook remains usable.                                      | Track vendor bundle separately; no application code is excluded from checks.                                                                            | Frontend platform | 2026-10-31  | Pending engineering review |
| W2-A11Y-002 | Human screen-reader and visual accessibility attestation has not yet been completed. | No known accessibility defect; a human assistive-technology review remains required. | CI enforces keyboard, responsive, Storybook interaction, and serious/critical Axe checks. Complete a named screen-reader review before the expiry date. | Frontend platform | 2026-08-05  | User-authorized 2026-07-22 |

Every accepted exception must have a concrete owner, a mitigation, and an expiry date. Expired exceptions block the Week 2 exit gate until they are resolved or explicitly renewed.
