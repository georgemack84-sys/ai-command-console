# Nuru NSI staging recovery and egress drill

Run this drill against a disposable staging restore target. Do not point the
restore at the running staging database, and do not record connection strings,
raw artifact bodies, or secrets in the evidence bundle.

## Preconditions

- The release candidate has passed `npm run verify:nsi:signoff`.
- Staging uses the external worker profile, Redis, and the Nuru egress proxy.
- The restore target has the same PostgreSQL major version and approved
  encryption/key-management posture as staging.
- Select a workspace containing at least one raw artifact and record its ID as
  `NSI_WORKSPACE_ID` in the operator shell.

## Recovery exercise

1. On the source staging deployment, create a JSON baseline outside the backup
   payload:

   ```sh
   npm run nsi:verify-artifacts -- "$NSI_WORKSPACE_ID" > nsi-baseline.json
   ```

2. Take an encrypted, named PostgreSQL backup using the platform-approved
   mechanism. Record its immutable backup ID, source release SHA, and time.
   Restore it only into the isolated target.

3. On the restored target, run the verifier against the retained baseline:

   ```sh
   npm run nsi:verify-artifacts -- "$NSI_WORKSPACE_ID" \
     --baseline-file /protected/evidence/nsi-baseline.json
   ```

   The workspace ID and all three expected values are checked from the baseline;
   individual expected-value flags are intentionally rejected in this mode.

4. Treat any non-zero exit, hash mismatch, count mismatch, or integrity failure
   as a recovery failure. Preserve the target for investigation; do not retry by
   editing raw artifacts or audit events.

5. Retain the source output, restored-target output, command exit status,
   backup ID, restore target identifier, timestamps, release SHA, and operator
   approval in the protected release-evidence store. Use the
   [staging sign-off evidence template](NURU_NSI_STAGING_EVIDENCE_TEMPLATE.md)
   to record the exercise.

## Egress exercise

Start staging with the worker and proxy:

```sh
docker compose -f docker-compose.staging.yml --profile external-worker up -d
```

For a reviewed domain present in `docker/nuru-egress/allowed-domains.txt`, queue
one benign NSI retrieval and confirm that the external worker completes it. Then
attempt an unlisted public domain and a private-address target. Both must fail
without artifact creation, while the allowed retrieval must show only the proxy
as its network egress path. Capture worker and proxy logs with secrets and raw
content redacted.

## Exit criteria

The drill passes only when recovery comparison succeeds for a non-empty
workspace, allowed egress succeeds, blocked egress fails closed, and the
evidence bundle is retained. A local empty-workspace result does not satisfy
this drill.
