# Week 2 accessibility evidence checklist

Use this checklist during a manual browser and assistive-technology review. Record the date, reviewer, route or story, browser, viewport, and result in the pull request or validation report. Do not mark an item complete based only on a static build.

## Automated evidence — 2026-08-14 (GP-24)

| Check                         | Evidence                                                                                                                                                                 | Result |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Responsive shell              | Playwright Chromium verifies no document overflow at 320, 375, 768, 1024, 1280, 1440, and 1920 px, including cleanup when an open drawer crosses the 1024 px breakpoint. | Passed |
| Keyboard and focus            | Playwright verifies skip-link, drawer, form, Dialog, Alert Dialog, Dropdown Menu, route-recovery, focus-visible, Escape, and trigger-restoration contracts.              | Passed |
| Automated accessibility       | Axe on the shell rejects every serious and critical violation.                                                                                                           | Passed |
| Public component interactions | Built Storybook tests 320 px layouts, 200% root text scaling, themes, reduced motion, portal cleanup, browser errors, and overlay interaction.                           | Passed |

This automated evidence does not substitute for manual zoom, screen-reader, and visual contrast review. The named human evidence below completes those checks.

## Human evidence — 2026-08-15

| Check              | Evidence                                                                                                                                                                | Result |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Screen reader      | George Mack reviewed the login specimen with Windows Narrator in Google Chrome and confirmed the username, password, visibility-toggle state, and submit announcements. | Passed |
| Native 200% zoom   | Chrome reported 200%; every login control remained reachable by keyboard, focus remained visible, and vertically scrolled content remained available.                   | Passed |
| Visual contrast    | Light and dark login, mobile navigation, long-dialog, and recoverable-error specimens retained readable text, controls, feedback, and focus indicators.                 | Passed |
| Defect remediation | The ambiguous password-visibility dot found during review was replaced by a recognizable eye/eye-off icon and rechecked at 200%.                                        | Passed |

The former temporary exception `W2-A11Y-002` expired on 2026-08-05 and was
resolved by this review rather than renewed. It has been removed from the active
exception register.

The authoritative completion state is recorded in
`accessibility-attestation.json`. Automation validates that record; only the
named reviewer confirmation authorizes its completed status.

## Keyboard and focus

- The skip link is the first focusable item and moves focus to `#main-workspace`.
- Desktop navigation exposes the active route with `aria-current="page"`.
- The mobile drawer traps focus while open, closes with Escape, restores focus to its trigger, and restores page scroll after the final overlay closes.
- Dialog and Alert Dialog focus is contained while open, Escape has the documented effect, and focus returns to the trigger after dismissal.
- Alert Dialog cancellation never performs its destructive action.
- Dropdown Menu supports documented keyboard operation, including Escape dismissal and disabled-item behavior.

## Semantics and announcements

- Every icon-only action has a non-empty accessible name.
- Every field has a programmatic label; descriptions and errors are associated with the field.
- Required and invalid field states are announced correctly.
- Informational and successful alerts use a non-interrupting status announcement; urgent errors use an alert announcement only when interruption is warranted.
- Loading indicators and skeletons expose only their intended accessible information.
- Error and unavailable states do not disclose raw exception details, tokens, paths, or backend payloads.

## Responsive and visual review

- Review the shell and public component stories at 320 px, 768 px, and a desktop viewport.
- Verify content remains reachable at 200% browser zoom and that keyboard focus remains visible.
- Verify light, dark, and system themes retain semantic contrast for text, controls, focus indicators, overlays, and feedback variants.
- Verify menus and dialogs remain visible and operable near viewport edges without horizontal page overflow.

Any failure, limitation, or accepted temporary deviation must be entered in `accessibility-exceptions.md` with an owner and expiry date.
