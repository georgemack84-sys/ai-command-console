# Nuru Staging Acceptance Checklist

Run this checklist after a successful staging deployment and a successful manual **Prepare Nuru Daily Edition** workflow run. Use an administrator account for Studio checks and a normal account for the rest.

## Service and edition readiness

- [ ] `GET /api/health` and `GET /api/ready` return `200`.
- [ ] `/nuru` renders a seven-item discovery collection.
- [ ] The featured discovery opens and its detail page renders a summary, rationale, connection, and exploration paths.
- [ ] **Prepare Nuru Daily Edition** is run with `target_environment=staging` and exits successfully with a prepared seven-item candidate.
- [ ] In `/nuru/studio/editions`, the candidate has seven distinct active discoveries and exactly one featured selection.
- [ ] Publishing the edition makes the same seven discoveries available on `/nuru` after refresh.

## Signed-in curiosity flows

- [ ] Save a discovery; it appears in `/nuru/collection` after refresh.
- [ ] Dismiss that discovery; it no longer appears in the collection and is not simultaneously saved.
- [ ] On a discovery detail page, choose both **More like this** and **Less like this** in separate checks; the latest choice persists after refresh.
- [ ] Complete and reopen a Rabbit Hole step; progress persists.
- [ ] In `/nuru/taste-map`, confirm a signal and quiet a signal; both changes persist after refresh.

## Data controls and permissions

- [ ] `/nuru/data` exports the signed-in account’s Nuru data successfully.
- [ ] Pausing learning stops personalization changes without deleting saved discoveries.
- [ ] Resuming learning restores normal interaction recording.
- [ ] A non-administrator cannot open or call Nuru Studio endpoints.
- [ ] An administrator can create a draft, publish it, unpublish it, and archive it from Nuru Studio.

## Exit and rollback signals

- [ ] Browser smoke coverage passes for desktop and mobile.
- [ ] No new high-severity runtime diagnostics appear after the acceptance pass.
- [ ] If a candidate cannot be prepared, do not publish an incomplete edition; retain the current edition and investigate the active catalog count.
