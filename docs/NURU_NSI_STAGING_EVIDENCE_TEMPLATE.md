# Nuru NSI staging sign-off evidence

Copy this template to the protected release-evidence store for each staging
drill. Do not place secrets, connection strings, raw artifact content, or
unredacted logs in the completed record.

## Identification

| Field | Value |
| --- | --- |
| Release SHA / artifact digest | |
| Drill operator | |
| Reviewer / approver | |
| Drill start and end (UTC) | |
| NSI workspace ID | |
| Restore-target identifier | |

## Recovery evidence

| Check | Result | Evidence reference |
| --- | --- | --- |
| Encrypted backup created | Pass / Fail | Backup ID only |
| Baseline verifier completed | Pass / Fail | Protected JSON record |
| Restore completed into isolated target | Pass / Fail | Restore job ID |
| Restored verifier used `--baseline-file` | Pass / Fail | Protected JSON record |
| Manifest hash matched | Pass / Fail | Verifier output |
| Artifact count matched | Pass / Fail | Verifier output |
| Audit-event count matched | Pass / Fail | Verifier output |

## Egress evidence

| Check | Result | Evidence reference |
| --- | --- | --- |
| Worker runs with external-worker profile | Pass / Fail | Redacted deployment output |
| Reviewed allowlisted source retrieved | Pass / Fail | Redacted job/proxy logs |
| Unlisted public source blocked | Pass / Fail | Redacted job/proxy logs |
| Private-address target blocked | Pass / Fail | Redacted job/proxy logs |
| Blocked attempts created no raw artifact | Pass / Fail | Query/output reference |

## Decision

- [ ] All checks passed; NSI operational sign-off approved.
- [ ] A failure occurred; release promotion is blocked.

Failure summary, remediation owner, and follow-up ticket:

```

```
