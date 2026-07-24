# Week 2 accessibility evidence checklist

Use this checklist during a manual browser and assistive-technology review. Record the date, reviewer, route or story, browser, viewport, and result in the pull request or validation report. Do not mark an item complete based only on a static build.

## Automated evidence — 2026-07-22

| Check                         | Evidence                                                                                                                                                                    | Result |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Responsive shell              | Playwright Chromium verifies no document overflow at 320, 375, 768, 1024, 1280, 1440, and 1920 px.                                                                          | Passed |
| Keyboard and focus            | Playwright verifies the skip link, drawer Escape dismissal, and trigger focus restoration. Storybook Chromium interactions verify dialog dismissal and menu disabled state. | Passed |
| Automated accessibility       | Axe on the shell rejects every serious and critical violation.                                                                                                              | Passed |
| Public component interactions | Playwright runs dialog dismissal and disabled-menu behavior against the built Storybook.                                                                                    | Passed |

This automated evidence does not substitute for manual zoom, screen-reader, and visual contrast review. Those items remain un-attested until a named reviewer records the browser, assistive technology, and outcome.

The Week 2 exit gate accepts this remaining manual review temporarily under exception `W2-A11Y-002`. The exception has a named owner, mitigation, and expiry date; it does not remove the requirement for a human review.

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
